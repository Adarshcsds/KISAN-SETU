import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MandiMarket, QualityGrade } from '../../types';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  Scale, 
  Percent, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface MarketCalculationResult {
  mandi: MandiMarket;
  grossPricePerQuintal: number;
  effectiveVolumeQuintals: number;
  grossRealization: number;
  freightCost: number;
  handlingCost: number;
  lossValue: number;
  netRealization: number;
  netRatePerQuintal: number;
  isRecommended: boolean;
  gainVsLocal: number;
}

export const SmartMarketPredictor: React.FC = () => {
  const { 
    commodities, 
    selectedCropId, 
    setSelectedCropId, 
    selectedCrop, 
    mandis, 
    setViewingMandiBuyers,
    t 
  } = useApp();

  const [quantity, setQuantity] = useState<number>(75);
  const [expectedLossPercent, setExpectedLossPercent] = useState<number>(2.0);
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('Grade A (Export)');
  const [maxDistance, setMaxDistance] = useState<number>(200);

  // Grade multiplier
  const gradeMultiplier = useMemo(() => {
    switch (qualityGrade) {
      case 'Grade A (Export)': return 1.03;
      case 'Grade B (Premium)': return 1.00;
      case 'Grade C (Standard)': return 0.95;
    }
  }, [qualityGrade]);

  // Market rankings calculation
  const marketResults: MarketCalculationResult[] = useMemo(() => {
    const validMandis = mandis.filter(m => m.distanceKm <= maxDistance);
    
    const calculated = validMandis.map(mandi => {
      const basePrice = selectedCrop.currentAvgPrice + (mandi.modalPrice - 2450) * 0.8;
      const adjustedPricePerQtl = Math.round(basePrice * gradeMultiplier);
      
      // Transit loss reduction in volume
      const effectiveVolume = quantity * (1 - (expectedLossPercent / 100));
      const gross = effectiveVolume * adjustedPricePerQtl;
      
      // Freight cost calculation: Base ₹600 + ₹26 per km
      const freight = Math.round(600 + (mandi.distanceKm * 26));
      
      // Mandi cess and loading/unloading handling cost
      const cess = gross * (mandi.mandiCessPercent / 100);
      const handling = quantity * mandi.avgHandlingCostPerQuintal;
      const totalHandling = Math.round(cess + handling);
      
      const lossVal = Math.round((quantity - effectiveVolume) * adjustedPricePerQtl);
      const net = Math.round(gross - freight - totalHandling);
      const netPerQtl = Math.round(net / quantity);

      return {
        mandi,
        grossPricePerQuintal: adjustedPricePerQtl,
        effectiveVolumeQuintals: effectiveVolume,
        grossRealization: gross,
        freightCost: freight,
        handlingCost: totalHandling,
        lossValue: lossVal,
        netRealization: net,
        netRatePerQuintal: netPerQtl,
        isRecommended: false,
        gainVsLocal: 0,
      };
    });

    // Sort by Net Realization descending
    calculated.sort((a, b) => b.netRealization - a.netRealization);

    if (calculated.length > 0) {
      calculated[0].isRecommended = true;
      const baselineLocalNet = calculated[calculated.length - 1].netRealization;
      calculated.forEach(c => {
        c.gainVsLocal = Math.max(0, c.netRealization - baselineLocalNet);
      });
    }

    return calculated;
  }, [mandis, selectedCrop, gradeMultiplier, quantity, expectedLossPercent, maxDistance]);

  const bestResult = marketResults[0];

  const handleSelectMarket = (mandi: MandiMarket) => {
    setViewingMandiBuyers(mandi);
  };

  return (
    <div className="clean-card p-5 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
                AI Net Price Realization Predictor
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                PROFIT CALCULATOR
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-0.5">
              Calculates your true in-hand profit after subtracting transport distance, handling, and transit loss
            </p>
          </div>
        </div>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
        
        {/* Crop Selection */}
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5 flex items-center justify-between">
            <span>Commodity Crop</span>
            <span className="text-[#2E7D32] text-[10px] font-semibold">{selectedCrop.category}</span>
          </label>
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2E7D32] transition cursor-pointer"
          >
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name} (Avg ₹{c.currentAvgPrice}/q)
              </option>
            ))}
          </select>
        </div>

        {/* Quantity (Quintals) */}
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5 flex items-center justify-between">
            <span>Harvest Volume</span>
            <span className="text-[#6B7280] font-mono text-[10px]">~{(quantity * 0.1).toFixed(1)} Metric Tonnes</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={5}
              max={1000}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-extrabold text-[#1F2937] focus:outline-none focus:border-[#2E7D32] transition pr-12 font-mono"
            />
            <span className="absolute right-3 top-2 text-xs text-[#6B7280] font-bold">Qtl</span>
          </div>
        </div>

        {/* Expected Transit Loss % */}
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5 flex items-center justify-between">
            <span>Transit Loss Buffer</span>
            <span className="text-[#D97706] font-mono text-[10px] font-bold">{expectedLossPercent}%</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min={0}
              max={15}
              value={expectedLossPercent}
              onChange={(e) => setExpectedLossPercent(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-extrabold text-[#1F2937] focus:outline-none focus:border-[#2E7D32] transition pr-8 font-mono"
            />
            <span className="absolute right-3 top-2 text-xs text-[#6B7280] font-bold">%</span>
          </div>
        </div>

        {/* Quality Grade */}
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
            Crop Quality Grade
          </label>
          <select
            value={qualityGrade}
            onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
            className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2E7D32] transition cursor-pointer"
          >
            <option value="Grade A (Export)">Grade A (Export Premium +3%)</option>
            <option value="Grade B (Premium)">Grade B (Domestic Standard)</option>
            <option value="Grade C (Standard)">Grade C (Fair Average -5%)</option>
          </select>
        </div>

      </div>

      {/* Recommended Best Market Highlight Card */}
      {bestResult && (
        <div className="clean-card p-5 sm:p-6 border-2 border-[#2E7D32] bg-[#F0FDF4] relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            
            {/* Left Market Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2E7D32] text-white">
                  ★ HIGHEST PROFIT MARKET
                </span>
                <span className="text-xs text-[#4B5563] font-medium">• {bestResult.mandi.distanceKm} km away</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#1F2937]">
                {bestResult.mandi.name} ({bestResult.mandi.district})
              </h3>

              <div className="flex items-center space-x-3 text-xs text-[#4B5563]">
                <span className="text-[#15803D] font-bold">
                  🏢 {bestResult.mandi.verifiedBuyersCount} Institutional Buyers Ready
                </span>
                <span>•</span>
                <span>⭐ {bestResult.mandi.rating} Rating</span>
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-[#BBF7D0] text-xs">
              
              <div className="p-2">
                <div className="text-[10px] text-[#6B7280]">Offered Rate</div>
                <div className="text-sm font-bold text-[#1F2937] mt-0.5 font-mono">₹{bestResult.grossPricePerQuintal}/q</div>
                <div className="text-[10px] text-[#6B7280]">₹{bestResult.grossRealization.toLocaleString('en-IN')} gross</div>
              </div>

              <div className="p-2">
                <div className="text-[10px] text-[#6B7280]">Freight Cost</div>
                <div className="text-sm font-bold text-[#DC2626] mt-0.5 font-mono">-₹{bestResult.freightCost.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-[#6B7280]">Fixed ₹26/km</div>
              </div>

              <div className="p-2">
                <div className="text-[10px] text-[#6B7280]">Handling & Cess</div>
                <div className="text-sm font-bold text-[#D97706] mt-0.5 font-mono">-₹{bestResult.handlingCost.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-[#6B7280]">{bestResult.mandi.mandiCessPercent}% Cess</div>
              </div>

              <div className="p-2 bg-[#DCFCE7] rounded-lg border border-[#86EFAC]">
                <div className="text-[10px] text-[#15803D] font-bold">NET IN-HAND PAYOUT</div>
                <div className="text-base font-extrabold text-[#15803D] font-mono mt-0.5">
                  ₹{bestResult.netRealization.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#166534] font-semibold">₹{bestResult.netRatePerQuintal}/q in-hand</div>
              </div>

            </div>

            {/* Action CTA to View Buyers */}
            <div>
              <button
                onClick={() => handleSelectMarket(bestResult.mandi)}
                className="w-full lg:w-auto px-6 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>View Buyers at this Market</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Alternative Market Realization Comparison Table */}
      <div>
        <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-3">
          All Regional Markets Ranked by Net Realization ({marketResults.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {marketResults.map((res, index) => (
            <div
              key={res.mandi.id}
              onClick={() => handleSelectMarket(res.mandi)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                res.isRecommended
                  ? 'bg-[#F0FDF4] border-[#86EFAC] hover:border-[#2E7D32]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    res.isRecommended ? 'bg-[#2E7D32] text-white' : 'bg-[#F3F4F6] text-[#4B5563]'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="font-bold text-xs text-[#1F2937] truncate max-w-[160px]">{res.mandi.name}</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#6B7280]">{res.mandi.distanceKm} km</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs my-2.5 pt-2 border-t border-[#E5E7EB]">
                <div>
                  <div className="text-[10px] text-[#6B7280]">Offered Rate</div>
                  <div className="font-bold text-[#1F2937]">₹{res.grossPricePerQuintal}/q</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280]">Net In-Hand</div>
                  <div className="font-extrabold text-[#15803D] font-mono">₹{res.netRealization.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[11px]">
                <span className="text-[#6B7280] font-medium">{res.mandi.verifiedBuyersCount} Buyers</span>
                <span className="text-[#2E7D32] font-bold flex items-center">
                  Select <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
