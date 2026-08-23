import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Role, Language } from '../../types';
import { 
  Sprout, 
  Building2, 
  Users, 
  ShieldCheck, 
  Bell, 
  Globe, 
  Wallet, 
  Lock, 
  CheckCircle2, 
  Truck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    role, 
    setRole, 
    language, 
    setLanguage, 
    t, 
    notifications, 
    markNotificationAsRead, 
    clearAllNotifications, 
    unreadCount,
    farmerWalletBalance,
    buyerEscrowLocked,
    setActiveTab,
    setDispatchingOrderId,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const roles: { id: Role; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'farmer', label: 'Farmer', icon: <Sprout className="w-4 h-4 text-emerald-400" />, desc: 'Market predictor, sell crop, dispatch vehicle' },
    { id: 'buyer', label: 'Buyer', icon: <Building2 className="w-4 h-4 text-amber-400" />, desc: 'Review orders, accept bids, track inbound trucks' },
    { id: 'fpo', label: 'FPO Aggregator', icon: <Users className="w-4 h-4 text-blue-400" />, desc: 'Bulk pooling & member dividends' },
    { id: 'admin', label: 'Market Assayer', icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, desc: 'Quality audit & compliance' },
  ];

  const languages: { id: Language; label: string; nativeName: string }[] = [
    { id: 'en', label: 'English', nativeName: 'English' },
    { id: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
    { id: 'mr', label: 'Marathi', nativeName: 'मराठी' },
    { id: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { id: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  ];

  const handleNotificationClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    if (notif.orderId) {
      if (notif.type === 'order_accepted' && role === 'farmer') {
        setDispatchingOrderId(notif.orderId);
      }
      setActiveTab('orders');
    }
    setIsNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1E5128] text-white shadow-md border-b border-[#163f1f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#1E5128] shadow-sm">
              <Sprout className="w-5 h-5 text-[#1E5128] stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Kisan<span className="text-[#DCFCE7]">Setu</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#143B1D] text-[#86EFAC] border border-[#2E7D32] font-mono">
                  PRO
                </span>
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#143B1D] text-[#86EFAC] border border-[#2E7D32] hover:bg-[#0D2813] transition font-mono"
                  title="Open FastAPI Swagger Documentation"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-pulse" />
                  <span>FastAPI (8000)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Center Navigation Role Switcher */}
          <div className="hidden lg:flex items-center bg-[#143B1D] p-1 rounded-xl border border-[#276634]">
            {roles.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'text-[#D1E7D5] hover:text-white hover:bg-[#1A4B24]'
                  }`}
                  title={r.desc}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Mobile Role Selector */}
            <div className="lg:hidden">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-[#143B1D] text-xs text-white border border-[#276634] rounded-lg px-2 py-1.5 font-bold"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Financial Status Capsule */}
            {role === 'farmer' ? (
              <div className="hidden sm:flex items-center space-x-2 bg-[#143B1D] border border-[#2E7D32] px-3 py-1.5 rounded-xl">
                <Wallet className="w-4 h-4 text-[#86EFAC]" />
                <div>
                  <div className="text-[10px] text-[#A7F3D0] font-medium">{t('farmer_wallet')}</div>
                  <div className="text-xs font-extrabold text-white font-mono">₹{farmerWalletBalance.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 bg-[#E67E22] text-white border border-[#D35400] px-3 py-1.5 rounded-xl">
                <Lock className="w-4 h-4 text-white" />
                <div>
                  <div className="text-[10px] text-white/90 font-medium">{t('escrow_locked_title')}</div>
                  <div className="text-xs font-extrabold text-white font-mono">₹{(buyerEscrowLocked / 10000000).toFixed(2)} Cr</div>
                </div>
              </div>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1.5 bg-[#143B1D] hover:bg-[#1A4B24] border border-[#276634] rounded-xl px-2.5 py-1.5 text-xs text-white transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#86EFAC]" />
                <span className="font-bold uppercase">{language}</span>
                <ChevronDown className="w-3 h-3 text-[#A7F3D0]" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-1.5 z-50 text-[#1F2937]">
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLanguage(l.id);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                        language === l.id ? 'bg-[#DCFCE7] text-[#15803D] font-bold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      <span>{l.nativeName}</span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono">({l.label})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Hub */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl bg-[#143B1D] hover:bg-[#1A4B24] border border-[#276634] text-white transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E67E22] text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 z-50 text-[#1F2937]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
                    <span className="font-bold text-xs text-[#1F2937]">Real-Time Notifications</span>
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-[#2E7D32] hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#6B7280] py-4 text-center">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer border transition ${
                            n.read 
                              ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]' 
                              : 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="flex items-center space-x-1.5">
                              {n.type === 'order_accepted' && <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />}
                              {n.type === 'dispatched' && <Truck className="w-3.5 h-3.5 text-[#2563EB]" />}
                              <span>{n.title}</span>
                            </span>
                            <span className="text-[10px] text-[#6B7280] font-normal">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-[#4B5563] leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 bg-[#143B1D] hover:bg-[#1A4B24] border border-[#276634] rounded-xl px-2.5 py-1.5 transition cursor-pointer text-white"
              >
                <span className="text-base">{currentUser.avatarUrl || '👤'}</span>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-white truncate max-w-[100px]">{currentUser.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-[#86EFAC] capitalize font-medium">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-[#A7F3D0]" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 z-50 space-y-2.5 text-[#1F2937]">
                  <div className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs">
                    <div className="font-bold text-[#1F2937] flex items-center space-x-1.5">
                      <span>{currentUser.avatarUrl}</span>
                      <span>{currentUser.name}</span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] mt-0.5">
                      📍 {currentUser.location}, {currentUser.district}
                    </div>
                    <div className="text-[10px] font-mono text-[#2E7D32] font-semibold mt-1">
                      📱 +91 {currentUser.phone}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#1F2937] hover:bg-[#F3F4F6] flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Switch / Login Account</span>
                      <span className="text-[10px] text-[#6B7280]">लॉगिन</span>
                    </button>

                    <button
                      onClick={() => {
                        setAuthModalMode('register');
                        setIsAuthModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#15803D] bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] flex items-center justify-between transition cursor-pointer"
                    >
                      <span>+ Register New Account</span>
                      <span className="text-[10px] text-[#15803D]">नोंदणी</span>
                    </button>

                    <button
                      onClick={() => {
                        setAuthModalMode('forgot_password');
                        setIsAuthModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[11px] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition cursor-pointer"
                    >
                      Forgot / Reset Password
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
