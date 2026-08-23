import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderRequest, Transporter } from '../../types';
import { 
  X, 
  Truck, 
  CheckSquare, 
  QrCode, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  Download, 
  Phone,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface VehicleDispatchModalProps {
  order: OrderRequest;
  onClose: () => void;
}

export const VehicleDispatchModal: React.FC<VehicleDispatchModalProps> = ({ order, onClose }) => {
  const { transporters, dispatchVehicle } = useApp();

  const [selectedTransporterId, setSelectedTransporterId] = useState<string>(transporters[0].id);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [checklist, setChecklist] = useState({
    grossVerified: true,
    tareChecked: true,
    netConfirmed: true,
    loadingSupervised: true,
    goodsCovered: true,
    digitalSealApplied: true,
  });

  const selectedTransporter = transporters.find(t => t.id === selectedTransporterId) || transporters[0];

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCompleteDispatch = () => {
    dispatchVehicle(order.id, {
      transporterId: selectedTransporter.id,
      transporterName: selectedTransporter.name,
      truckType: selectedTransporter.truckType,
      licensePlate: selectedTransporter.licensePlate,
      driverName: selectedTransporter.driverName,
      driverPhone: selectedTransporter.driverPhone,
    });
    onClose();
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#1F2937]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] flex items-center justify-center text-white shadow-sm">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
                Vehicle Loading & Dispatch Confirmation
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                <CheckCircle2 className="w-3 h-3 inline mr-1 text-[#15803D]" /> ORDER APPROVED
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-0.5">
              Order <span className="font-mono font-bold text-[#15803D]">{order.id}</span> accepted by <span className="font-bold text-[#1F2937]">{order.buyerCompany}</span> for {order.quantityQuintals} Qtl {order.cropName}.
            </p>
          </div>
        </div>

        {/* 3 Step Wizard Progress Bar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { step: 1, title: '1. Assign Transporter' },
            { step: 2, title: '2. Loading & Weighing' },
            { step: 3, title: '3. Gate Pass & Dispatch' },
          ].map((s) => (
            <div
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`p-2.5 rounded-xl border text-center cursor-pointer transition ${
                currentStep === s.step
                  ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D] font-bold'
                  : currentStep > s.step
                  ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#1F2937] font-semibold'
                  : 'bg-white border-[#E5E7EB] text-[#9CA3AF]'
              }`}
            >
              <div className="text-[11px] truncate">{s.title}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Assign Transporter */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#2E7D32]" />
              <span>Select Verified Transporter & Vehicle</span>
            </h3>

            <div className="space-y-3">
              {transporters.map((t) => {
                const isSelected = t.id === selectedTransporterId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTransporterId(t.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#F0FDF4] border-[#86EFAC] shadow-sm'
                        : 'bg-white border-[#E5E7EB] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`p-3 rounded-xl ${isSelected ? 'bg-[#2E7D32] text-white' : 'bg-[#F3F4F6] text-[#4B5563]'}`}>
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-[#1F2937]">{t.name}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F3F4F6] text-[#1F2937] rounded-md border border-[#E5E7EB]">
                            {t.truckType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-[#4B5563] mt-1">
                          <span className="font-mono text-[#1F2937] font-semibold">Plate: {t.licensePlate}</span>
                          <span>•</span>
                          <span>Driver: {t.driverName} ({t.driverPhone})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between text-right">
                      <div className="text-xs font-bold text-[#15803D]">₹{t.ratePerKm}/km</div>
                      <div className="text-[11px] text-[#B45309] font-bold">★ {t.rating} Verified</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold flex items-center space-x-2 transition cursor-pointer shadow-sm"
              >
                <span>Proceed to Weighing Checklist</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Loading & Weighing Checklist */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-[#2E7D32]" />
              <span>Weight & Loading Verification Checklist</span>
            </h3>

            {/* Weighbridge Values */}
            <div className="grid grid-cols-3 gap-3 bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB] text-center">
              <div>
                <div className="text-[10px] text-[#6B7280]">Gross Weight</div>
                <div className="text-base font-extrabold text-[#1F2937] font-mono">{order.quantityQuintals + 40} Qtl</div>
                <div className="text-[9px] text-[#9CA3AF] font-semibold">(Truck + Crop)</div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B7280]">Tare Weight</div>
                <div className="text-base font-extrabold text-[#1F2937] font-mono">40 Qtl</div>
                <div className="text-[9px] text-[#9CA3AF] font-semibold">(Empty Truck)</div>
              </div>
              <div className="bg-[#DCFCE7] p-1.5 rounded-xl border border-[#86EFAC]">
                <div className="text-[10px] text-[#15803D] font-bold">Net Cargo Weight</div>
                <div className="text-base font-extrabold text-[#15803D] font-mono">{order.quantityQuintals} Qtl</div>
                <div className="text-[9px] text-[#15803D] font-semibold">100% Confirmed</div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'grossVerified', label: 'Gross Weight Verified on Weighbridge' },
                { key: 'tareChecked', label: 'Tare Weight of Empty Vehicle Checked' },
                { key: 'netConfirmed', label: 'Net Cargo matches Order Quantity (75 Qtl)' },
                { key: 'loadingSupervised', label: 'Loading Supervised at Farm Gate' },
                { key: 'goodsCovered', label: 'Tarpaulin Cover & Waterproofing Applied' },
                { key: 'digitalSealApplied', label: 'Tamper-Proof Digital Seal Locked' },
              ].map((item) => {
                const checked = checklist[item.key as keyof typeof checklist];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleChecklist(item.key as keyof typeof checklist)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                      checked
                        ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#1F2937]'
                        : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                      checked ? 'bg-[#2E7D32] text-white' : 'border border-[#D1D5DB] bg-white'
                    }`}>
                      {checked && '✓'}
                    </div>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl bg-white text-[#4B5563] text-xs font-bold border border-[#D1D5DB] hover:bg-[#F3F4F6] transition cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold flex items-center space-x-2 transition cursor-pointer shadow-sm"
              >
                <span>Generate Gate Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: QR Gate Pass & Live Dispatch */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-[#2E7D32]" />
              <span>Digital QR Gate Pass & Live Route Simulation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* QR Gate Pass Card (5 cols) */}
              <div className="md:col-span-5 bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] text-center space-y-3">
                <div className="text-xs font-bold text-[#1F2937] flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                  <span>Tamper-Proof Gate Pass</span>
                </div>

                {/* High-Res QR Card */}
                <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-[#E5E7EB]">
                  <div className="w-32 h-32 bg-[#F3F4F6] rounded flex flex-col items-center justify-center text-[#1F2937] text-[10px] font-mono p-2 text-center space-y-1">
                    <QrCode className="w-16 h-16 text-[#2E7D32]" />
                    <span className="font-bold">PASS: {order.id}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#4B5563] font-mono space-y-0.5">
                  <div className="text-[#15803D] font-bold">E-Way: EWB-2026-984210</div>
                  <div>Truck: {selectedTransporter.licensePlate}</div>
                  <div>Driver: {selectedTransporter.driverName}</div>
                </div>
              </div>

              {/* Transit Map & Route Simulation (7 cols) */}
              <div className="md:col-span-7 bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] space-y-3 flex flex-col justify-between">
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280] font-medium">Origin:</span>
                    <span className="font-bold text-[#1F2937]">{order.farmerLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280] font-medium">Destination:</span>
                    <span className="font-bold text-[#15803D]">{order.targetMarketName} ({order.buyerCompany})</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
                    <span className="text-[#6B7280] font-medium">Estimated Transit Time:</span>
                    <span className="font-mono font-bold text-[#B45309]">~1h 45m (58 km)</span>
                  </div>
                </div>

                {/* Visual Route Path */}
                <div className="p-3 bg-white rounded-xl border border-[#E5E7EB] relative shadow-sm">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#4B5563] mb-1 font-bold">
                    <span className="flex items-center text-[#15803D]">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> Farm Gate
                    </span>
                    <span className="flex items-center text-[#B45309]">
                      <Navigation className="w-3.5 h-3.5 mr-1" /> Buyer Mill
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden relative">
                    <div className="bg-[#2E7D32] h-full w-1/4 rounded-full" />
                  </div>
                  <div className="text-[10px] text-[#6B7280] text-center mt-1.5 font-medium">
                    Live GPS telemetry will stream automatically upon dispatch
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-white text-[#4B5563] text-xs font-bold border border-[#D1D5DB] hover:bg-[#F3F4F6] transition cursor-pointer"
              >
                Back
              </button>

              <button
                onClick={handleCompleteDispatch}
                className="px-8 py-3 rounded-2xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-sm font-bold shadow-md flex items-center space-x-2 transition cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Dispatch Vehicle & Start Tracking</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
