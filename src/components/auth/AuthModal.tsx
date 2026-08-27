import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { 
  X, 
  User as UserIcon, 
  Lock, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode, 
    setAuthModalMode, 
    loginUser, 
    registerUser, 
    t 
  } = useApp();

  const [identifier, setIdentifier] = useState<string>('9822455192');
  const [password, setPassword] = useState<string>('kisan@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [userCaptchaInput, setUserCaptchaInput] = useState<string>('');

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<Role>('farmer');
  const [regLocation, setRegLocation] = useState<string>('');
  const [regDistrict, setRegDistrict] = useState<string>('Nashik');
  const [regState, setRegState] = useState<string>('Maharashtra');
  const [regFarmSize, setRegFarmSize] = useState<number>(6.5);
  const [regCompanyName, setRegCompanyName] = useState<string>('');
  const [regPinCode, setRegPinCode] = useState<string>('');
  const [regCrops, setRegCrops] = useState<string>('');
  const [regCropCategory, setRegCropCategory] = useState<string>('Grain');
  const [regBuyerType, setRegBuyerType] = useState<string>('');
  const [regWarehouseAvailable, setRegWarehouseAvailable] = useState<boolean>(false);
  const [regColdStorageAvailable, setRegColdStorageAvailable] = useState<boolean>(false);
  const [regVehicleTypes, setRegVehicleTypes] = useState<string>('');
  const [regVehicleCapacity, setRegVehicleCapacity] = useState<string>('');
  const [regServiceAreas, setRegServiceAreas] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  // Forgot Password State
  const [resetPhone, setResetPhone] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  // Generate random 5-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptchaInput('');
    setErrorMsg('');
  };

  useEffect(() => {
    if (isAuthModalOpen) {
      generateCaptcha();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Verify Captcha
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMsg('Invalid Captcha code. Please enter the characters shown in the box.');
      generateCaptcha();
      return;
    }

    try {
      await loginUser(identifier.trim(), password);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regPhone.trim()) {
      setErrorMsg('Please fill in your name and mobile number.');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Verify Captcha
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMsg('Invalid Captcha. Please enter the correct characters.');
      generateCaptcha();
      return;
    }

    const baseProfile = { district: regDistrict, state: regState, pinCode: regPinCode.trim() };
    const profile = regRole === 'farmer'
      ? { ...baseProfile, location: regLocation.trim(), farmSizeAcres: regFarmSize, primaryCrop: regCrops.split(',')[0]?.trim(), crops: regCrops.split(',').map(name => name.trim()).filter(Boolean).map((name, index) => ({ name, category: regCropCategory, isPrimary: index === 0 })) }
      : regRole === 'buyer'
        ? { ...baseProfile, firmName: regCompanyName.trim(), businessType: regBuyerType.trim(), address: regLocation.trim() }
        : { ...baseProfile, firmName: regCompanyName.trim(), address: regLocation.trim(), warehouseAvailable: regWarehouseAvailable, coldStorageAvailable: regColdStorageAvailable, vehicleTypes: regVehicleTypes.split(',').map(value => value.trim()).filter(Boolean), vehicleCapacity: regVehicleCapacity.trim(), serviceAreas: regServiceAreas.split(',').map(value => value.trim()).filter(Boolean) };
    try {
      const created = await registerUser({ name: regName.trim(), phone: regPhone.trim(), email: regEmail.trim(), role: regRole, password: regPassword, profile });
      setSuccessMsg(`Welcome to KisanSetu, ${created.name}! Your account is now active.`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to create account.');
    }
  };

  // Handle Send OTP for Password Reset
  const handleSendOtp = () => {
    if (!resetPhone.trim()) {
      setErrorMsg('Please enter your registered mobile number.');
      return;
    }
    setErrorMsg('Password reset is not configured yet. Please contact platform support.');
  };

  // Handle Password Reset Confirm
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== generatedOtp) {
      setErrorMsg('Invalid OTP. Please check the 4-digit code.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setErrorMsg('Password reset is not configured yet. Please contact platform support.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#1F2937]">
        
        {/* Close button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D] shadow-sm">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
              {authModalMode === 'login' && 'Sign In to KisanSetu'}
              {authModalMode === 'register' && 'Create New Account'}
              {authModalMode === 'forgot_password' && 'Reset Account Password'}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {authModalMode === 'login' && 'Access personalized market rates, buyer bids, and vehicle dispatch'}
              {authModalMode === 'register' && 'Join thousands of farmers, FPOs and verified institutional buyers'}
              {authModalMode === 'forgot_password' && 'Enter your phone number to receive a secure verification OTP'}
            </p>
          </div>
        </div>

        {/* Auth Mode Tabs (Login / Register) */}
        {authModalMode !== 'forgot_password' && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] mb-5">
            <button
              onClick={() => { setAuthModalMode('login'); setErrorMsg(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                authModalMode === 'login'
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              Sign In (लॉगिन)
            </button>
            <button
              onClick={() => { setAuthModalMode('register'); setErrorMsg(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                authModalMode === 'register'
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              New Register (नोंदणी)
            </button>
          </div>
        )}

        {/* Alerts / Error Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#B91C1C] flex items-start space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-xs text-[#15803D] flex items-start space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- 1. LOGIN FORM --- */}
        {authModalMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1 flex items-center justify-between">
                <span>Mobile Number or Email</span>
                <span className="text-[10px] text-[#6B7280]">मोबाईल क्र. किंवा ईमेल</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9822455192 or email@domain.com"
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2E7D32] font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1F2937]">Password (पासवर्ड)</label>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('forgot_password'); setErrorMsg(''); }}
                  className="text-[11px] text-[#2E7D32] hover:underline font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2E7D32] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#1F2937] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Captcha Box */}
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-2">
              <label className="block text-[11px] font-bold text-[#1F2937]">
                Security Verification (सुरक्षा कॅप्चा)
              </label>

              <div className="flex items-center space-x-3">
                {/* Visual Captcha Display */}
                <div className="px-4 py-2 bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg select-none font-mono text-base font-extrabold tracking-widest text-[#15803D] shadow-inner flex items-center space-x-1">
                  {captchaCode.split('').map((char, index) => (
                    <span
                      key={index}
                      style={{
                        transform: `rotate(${((index % 2 === 0 ? 1 : -1) * (index + 1) * 4)}deg)`,
                        display: 'inline-block'
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2 rounded-lg bg-white hover:bg-[#F3F4F6] text-[#4B5563] border border-[#D1D5DB] transition cursor-pointer"
                  title="Generate new captcha code"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  placeholder="Enter Code"
                  maxLength={6}
                  className="flex-1 bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#1F2937] uppercase focus:outline-none focus:border-[#2E7D32]"
                  required
                />
              </div>
            </div>

            {/* Sign In CTA */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <span>Sign In (लॉगिन करा)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="pt-3 border-t border-[#E5E7EB] text-center text-[10px] text-[#6B7280]">
              Sign in with an account registered through KisanSetu. Demo records cannot authenticate.
            </p>

          </form>
        )}

        {/* --- 2. REGISTER FORM --- */}
        {authModalMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                Select Your Role (तुमची भूमिका निवडा)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'farmer' as Role, label: '👨‍🌾 Farmer (शेतकरी)' },
                  { role: 'buyer' as Role, label: '🏢 Buyer (खरेदीदार)' },
                  { role: 'logistics' as Role, label: '🚚 Logistics' },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.role}
                    onClick={() => setRegRole(r.role)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer ${
                      regRole === r.role
                        ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                        : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                  Full Name (संपूर्ण नाव) *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                  Mobile Number (मोबाईल क्र.) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32] font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email address" className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937]" required />
              <input type="text" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} placeholder={regRole === 'farmer' ? 'Farm location / address' : 'Business address'} className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937]" required />
              <input type="text" value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)} placeholder="District" className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937]" required />
              <input type="text" value={regState} onChange={(e) => setRegState(e.target.value)} placeholder="State" className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937]" required />
              <input type="text" value={regPinCode} onChange={(e) => setRegPinCode(e.target.value)} placeholder="PIN code" className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937]" required />
            </div>

            {/* Conditional Role-Specific Fields */}
            {regRole === 'farmer' && (
              <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1">
                    District (जिल्हा)
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#1F2937] font-bold"
                  >
                    <option value="Nashik">Nashik (नाशिक)</option>
                    <option value="Pune">Pune (पुणे)</option>
                    <option value="Ahmednagar">Ahmednagar (अहमदनगर)</option>
                    <option value="Nagpur">Nagpur (नागपूर)</option>
                    <option value="Kolhapur">Kolhapur (कोल्हापूर)</option>
                    <option value="Indore">Indore (इंदौर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1">
                    Farm Land Size (एकरी क्षेत्र)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={regFarmSize}
                    onChange={(e) => setRegFarmSize(Number(e.target.value))}
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#15803D] font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1">Crops (comma separated) and category</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={regCrops} onChange={(e) => setRegCrops(e.target.value)} placeholder="e.g. Wheat, Onion" className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs" required />
                    <select value={regCropCategory} onChange={(e) => setRegCropCategory(e.target.value)} className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs">
                      {['Vegetable', 'Grain', 'Pulse', 'Oilseed', 'Fruit', 'Other'].map(category => <option key={category}>{category}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {regRole === 'buyer' && (
              <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1">
                    Company / Mill Name
                  </label>
                  <input
                    type="text"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    placeholder="e.g. Mahalakshmi Agro"
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1">Buyer / Business Type</label>
                  <input
                    type="text"
                    value={regBuyerType}
                    onChange={(e) => setRegBuyerType(e.target.value)}
                    placeholder="e.g. Processor"
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#1F2937] font-mono uppercase font-bold"
                  />
                </div>
              </div>
            )}

            {regRole === 'logistics' && (
              <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                <input type="text" value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} placeholder="Transport firm name" className="col-span-2 w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs" required />
                <label className="text-[11px] text-[#4B5563]"><input type="checkbox" checked={regWarehouseAvailable} onChange={(e) => setRegWarehouseAvailable(e.target.checked)} /> Warehouse available</label>
                <label className="text-[11px] text-[#4B5563]"><input type="checkbox" checked={regColdStorageAvailable} onChange={(e) => setRegColdStorageAvailable(e.target.checked)} /> Cold storage available</label>
                <input type="text" value={regVehicleTypes} onChange={(e) => setRegVehicleTypes(e.target.value)} placeholder="Vehicle types (comma separated)" className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs" />
                <input type="text" value={regVehicleCapacity} onChange={(e) => setRegVehicleCapacity(e.target.value)} placeholder="Vehicle capacity" className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs" />
                <input type="text" value={regServiceAreas} onChange={(e) => setRegServiceAreas(e.target.value)} placeholder="Service areas (comma separated)" className="col-span-2 w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs" />
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32]"
                  required
                />
              </div>
            </div>

            {/* Captcha Box */}
            <div className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center space-x-3">
              <div className="px-3 py-1.5 bg-[#DCFCE7] border border-[#86EFAC] rounded font-mono font-bold text-[#15803D] text-sm tracking-wider">
                {captchaCode}
              </div>
              <button
                type="button"
                onClick={generateCaptcha}
                className="p-1.5 rounded bg-white text-[#4B5563] border border-[#D1D5DB] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                placeholder="Enter Captcha"
                className="flex-1 bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#1F2937] uppercase font-mono font-bold"
                required
              />
            </div>

            {/* Register CTA */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Account (खाते तयार करा)</span>
            </button>

          </form>
        )}

        {/* --- 3. FORGOT PASSWORD / OTP RECOVERY --- */}
        {authModalMode === 'forgot_password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            
            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    Enter Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="e.g. 9822455192"
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32] font-mono font-bold"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Send Verification OTP</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    Enter 4-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="e.g. 8392"
                    className="w-full bg-white border border-[#86EFAC] rounded-xl px-3.5 py-2.5 text-center text-base tracking-widest font-mono font-extrabold text-[#15803D] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    Enter New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reset Password & Sign In</span>
                </button>
              </div>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setAuthModalMode('login'); setOtpSent(false); }}
                className="text-xs text-[#4B5563] hover:text-[#2E7D32] underline font-bold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
