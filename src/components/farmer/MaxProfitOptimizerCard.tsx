import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  Percent, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight,
  Zap,
  Scale,
  DollarSign
} from 'lucide-react';

export const MaxProfitOptimizerCard: React.FC = () => {
  const { selectedCrop } = useApp();

  // Sample 75 quintal comparison
  const sampleQty = 75;
  const mandiRate = selectedCrop.currentAvgPrice;
  const buyerDirectRate = mandiRate + 65; // Institutional premium

  // Traditional distress sale breakdown
  const traditionalGross = sampleQty * (mandiRate - 80); // Trader undervaluation
  const traditionalMiddlemanCut = traditionalGross * 0.06; // 6% Arhatiya / middleman commission
  const traditionalLoss = sampleQty * 0.045 * mandiRate; // 4.5% transit & weighbridge manipulation
  const traditionalFreight = sampleQty * 38; // Unorganized freight
  const traditionalNet = Math.round(traditionalGross - traditionalMiddlemanCut - traditionalLoss - traditionalFreight);

  // KisanSetu Optimized selling breakdown
  const optimizedGross = sampleQty * buyerDirectRate;
  const optimizedMiddlemanCut = 0; // ZERO commission
  const optimizedLoss = sampleQty * 0.012 * buyerDirectRate; // <1.2% certified loss
  const optimizedFreight = Math.round(600 + 58 * 26); // Verified organized freight
  const optimizedCess = Math.round(sampleQty * 22);
  const optimizedNet = Math.round(optimizedGross - optimizedLoss - optimizedFreight - optimizedCess);

  const extraFarmerProfit = optimizedNet - traditionalNet;
  const profitPercentageBoost = Math.round((extraFarmerProfit / traditionalNet) * 100);

  return (
    <div className="clean-card p-5 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
              3-Way Profit Maximizer & Loss Minimizer
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-mono">
              +18% NET EXTRA PROFIT
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-1">
            Eliminates middleman cuts, controls post-harvest shrinkage, and arranges lowest-cost organized transport
          </p>
        </div>

        <div className="bg-[#F9FAFB] px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-right">
          <div className="text-[10px] text-[#6B7280]">Net Farmer Advantage (75 Qtl Lot)</div>
          <div className="text-base font-extrabold text-[#15803D] font-mono">
            +₹{extraFarmerProfit.toLocaleString('en-IN')} Extra in Pocket
          </div>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Pillar 1 */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold font-mono text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
              0% COMMISSION
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1F2937]">1. Max Price Realization</h3>
            <p className="text-[11px] text-[#4B5563] mt-0.5">
              Direct contracts with verified mills at premium rates (+₹65/q above spot).
            </p>
          </div>
          <div className="text-xs font-mono text-[#15803D] font-bold pt-1 border-t border-[#E5E7EB]">
            Direct Contract: ₹{buyerDirectRate}/q
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold font-mono text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FCD34D]">
              &lt;1.2% LOSS
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1F2937]">2. Min Transit Loss</h3>
            <p className="text-[11px] text-[#4B5563] mt-0.5">
              Digital sealed gate pass & moisture protection prevents shrinkage.
            </p>
          </div>
          <div className="text-xs font-mono text-[#B45309] font-bold pt-1 border-t border-[#E5E7EB]">
            Loss Saved: ~₹{(sampleQty * 0.033 * mandiRate).toFixed(0)}
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold font-mono text-[#1D4ED8] bg-[#DBEAFE] px-2 py-0.5 rounded border border-[#93C5FD]">
              -40% FREIGHT
            </span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1F2937]">3. Min Logistics Cost</h3>
            <p className="text-[11px] text-[#4B5563] mt-0.5">
              Fixed ₹26/km organized transport pool vs inflated ad-hoc truck broker rates.
            </p>
          </div>
          <div className="text-xs font-mono text-[#1D4ED8] font-bold pt-1 border-t border-[#E5E7EB]">
            Freight Saved: ~₹{(traditionalFreight - optimizedFreight).toFixed(0)}
          </div>
        </div>

      </div>

      {/* Side-by-Side Financial ROI Comparison Table */}
      <div className="bg-[#F9FAFB] rounded-xl p-4 sm:p-5 border border-[#E5E7EB] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">
            Real Financial Breakdown (75 Quintal {selectedCrop.name} Batch)
          </h4>
          <span className="text-[11px] text-[#15803D] font-bold">
            +{profitPercentageBoost}% Higher Return
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Traditional Middleman Sale */}
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
            <div className="flex items-center justify-between text-[#B91C1C] font-bold border-b border-[#FECACA] pb-1.5">
              <span>Traditional Distress Selling</span>
              <span className="text-[10px] font-mono bg-[#FEE2E2] px-2 py-0.5 rounded border border-[#FCA5A5]">Heavy Losses</span>
            </div>
            <div className="space-y-1 text-[#4B5563] text-[11px]">
              <div className="flex justify-between">
                <span>Gross Value:</span>
                <span className="text-[#1F2937] font-mono font-semibold">₹{traditionalGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#B91C1C]">
                <span>Middleman Commission (6%):</span>
                <span className="font-mono font-semibold">-₹{Math.round(traditionalMiddlemanCut).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#B91C1C]">
                <span>Transit Shrinkage & Loss (4.5%):</span>
                <span className="font-mono font-semibold">-₹{Math.round(traditionalLoss).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#B91C1C]">
                <span>Unorganized Freight:</span>
                <span className="font-mono font-semibold">-₹{traditionalFreight.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#FECACA] font-bold text-[#1F2937]">
              <span>Net Farmer In-Hand:</span>
              <span className="font-mono text-[#DC2626] text-sm font-extrabold">₹{traditionalNet.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* KisanSetu Smart Engine */}
          <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] space-y-2">
            <div className="flex items-center justify-between text-[#15803D] font-bold border-b border-[#BBF7D0] pb-1.5">
              <span className="flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#15803D]" />
                KisanSetu Smart Trade Engine
              </span>
              <span className="text-[10px] font-mono bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC] text-[#15803D]">Optimized</span>
            </div>
            <div className="space-y-1 text-[#4B5563] text-[11px]">
              <div className="flex justify-between">
                <span>Direct Institutional Rate:</span>
                <span className="text-[#1F2937] font-mono font-bold">₹{optimizedGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#15803D]">
                <span>Middleman Commission:</span>
                <span className="font-mono font-bold">₹0.00 (Zero Cut)</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Certified Transit Loss (&lt;1.2%):</span>
                <span className="font-mono font-semibold">-₹{Math.round(optimizedLoss).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Organized Freight (Fixed ₹26/km):</span>
                <span className="font-mono font-semibold">-₹{optimizedFreight.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#BBF7D0] font-bold text-[#1F2937]">
              <span className="text-[#15803D]">Net Farmer Bank Payout:</span>
              <span className="font-mono text-[#15803D] text-base font-extrabold">₹{optimizedNet.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
