import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerifiedBuyer, MandiMarket, QualityGrade } from '../../types';
import { 
  X, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Calculator, 
  MapPin, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface SendOrderModalProps {
  buyer: VerifiedBuyer;
  mandi: MandiMarket;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const SendOrderModal: React.FC<SendOrderModalProps> = ({ 
  buyer, 
  mandi, 
  onClose, 
  onSuccess 
}) => {
  const { selectedCrop, createOrderRequest, setActiveTab } = useApp();

  const [quantity, setQuantity] = useState<number>(75);
  const [proposedPrice, setProposedPrice] = useState<number>(buyer.offeredRatePerQuintal);
  const [variety, setVariety] = useState<string>(selectedCrop.varieties[0] || 'Standard');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('Grade A (Export)');
  const [moisturePercent, setMoisturePercent] = useState<number>(11.2);
  const [expectedLossPercent, setExpectedLossPercent] = useState<number>(1.5);
  const [farmerNotes, setFarmerNotes] = useState<string>('Harvested 3 days ago. Sun-dried and graded. Ready for instant farm-gate loading.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Financial preview
  const grossAmount = quantity * proposedPrice;
  const freightCost = Math.round(600 + (mandi.distanceKm * 26));
  const handlingCost = Math.round((grossAmount * (mandi.mandiCessPercent / 100)) + (quantity * mandi.avgHandlingCostPerQuintal));
  const netRealization = grossAmount - freightCost - handlingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const createdOrder = createOrderRequest({
        farmerName: 'Rajesh Kumar Patel',
        farmerLocation: 'Niphad Farm Gate, Nashik',
        farmerDistrict: 'Nashik',
        cropId: selectedCrop.id,
        cropName: selectedCrop.name,
        variety,
        quantityQuintals: quantity,
        qualityGrade,
        moisturePercent,
        expectedLossPercent,
        proposedPricePerQuintal: proposedPrice,
        grossAmount,
        freightCost,
        handlingCost,
        calculatedNetRealization: netRealization,
        targetMarketId: mandi.id,
        targetMarketName: mandi.name,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerCompany: buyer.companyName,
        farmerNotes,
      });

      setIsSubmitting(false);
      onSuccess(createdOrder.id);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-8 text-[#1F2937]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Buyer Header */}
        <div className="flex items-center space-x-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D] font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
              Send Trade Request to {buyer.name}
            </h3>
            <p className="text-xs text-[#4B5563]">
              {buyer.type} • Located at {mandi.name} ({mandi.distanceKm} km away)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Buyer Requirements Notice */}
          <div className="bg-[#F0FDF4] border border-[#86EFAC] p-3 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-[#15803D] font-bold">
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Buyer Benchmark Specs:
              </span>
              <span className="font-mono font-extrabold">Offered: ₹{buyer.offeredRatePerQuintal}/q</span>
            </div>
            <p className="text-[#4B5563] text-[11px] font-medium">{buyer.qualitySpecs}</p>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div>
              <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                Crop & Variety
              </label>
              <select
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32] font-bold"
              >
                {selectedCrop.varieties.map(v => (
                  <option key={v} value={v}>{selectedCrop.name} - {v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                Quantity (Quintals)
              </label>
              <input
                type="number"
                min={10}
                max={5000}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-extrabold text-[#15803D] focus:outline-none focus:border-[#2E7D32] font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                Proposed Selling Rate (₹/Quintal)
              </label>
              <input
                type="number"
                min={100}
                value={proposedPrice}
                onChange={(e) => setProposedPrice(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-extrabold text-[#15803D] focus:outline-none focus:border-[#2E7D32] font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                Measured Moisture (%)
              </label>
              <input
                type="number"
                step="0.1"
                min={5}
                max={25}
                value={moisturePercent}
                onChange={(e) => setMoisturePercent(Number(e.target.value))}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] font-bold focus:outline-none focus:border-[#2E7D32] font-mono"
              />
            </div>

          </div>

          {/* Quality Grade Radio */}
          <div>
            <label className="block text-[11px] font-bold text-[#1F2937] mb-1.5">
              Assayed Quality Grade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Grade A (Export)', 'Grade B (Premium)', 'Grade C (Standard)'] as QualityGrade[]).map(g => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setQualityGrade(g)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                    qualityGrade === g
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                      : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {g.split(' ')[0]} {g.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
              Farmer Notes & Farm Gate Pickup Details
            </label>
            <textarea
              rows={2}
              value={farmerNotes}
              onChange={(e) => setFarmerNotes(e.target.value)}
              className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#2E7D32]"
              placeholder="E.g., Farm gate location, truck accessibility, inspection timing..."
            />
          </div>

          {/* Calculated Net Realization Summary */}
          <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2">
            <div className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wide flex items-center justify-between">
              <span>Financial Deal Breakdown</span>
              <span className="text-[#15803D] font-mono font-bold">Net In-Hand Revenue</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#E5E7EB]">
              <div>
                <div className="text-[10px] text-[#6B7280]">Gross Total</div>
                <div className="font-bold text-[#1F2937]">₹{grossAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B7280]">Est. Freight</div>
                <div className="font-bold text-[#DC2626]">-₹{freightCost.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B7280]">Net Realization</div>
                <div className="font-extrabold text-[#15803D] text-sm font-mono">
                  ₹{netRealization.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#4B5563] text-xs font-bold border border-[#D1D5DB] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-extrabold shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <span>Sending Proposal...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Request to Buyer</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
