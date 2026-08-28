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
  Zap,
  ChevronDown,
  ChevronUp
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
  const [expectedLossPercent, setExpectedLossPercent] = useState<number>(1.5);
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('Grade A (Export)');
  const [maxDistance, setMaxDistance] = useState<number>(200);
  const [showCostDetails, setShowCostDetails] = useState<boolean>(false);

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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
                {t('ai_predictor_title')}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                {t('highest_profit')}
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-0.5">
              Calculates your true in-hand profit after subtracting transport distance, handling, and transit loss
            </p>
          </div>
        </div>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
        
        {/* Quantity (Quintals) with quick chips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1F2937] flex items-center justify-between">
            <span>{t('quantity') || 'Crop Quantity (क्विंटल)'}</span>
            <span className="text-[#6B7280] font-mono text-[11px]">~{(quantity * 0.1).toFixed(1)} MT</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={5}
              max={2000}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm font-extrabold text-[#1F2937] focus:outline-none focus:border-[#2E7D32] transition pr-12 font-mono"
            />
            <span className="absolute right-3 top-2.5 text-xs text-[#6B7280] font-bold">Qtl</span>
          </div>
          {/* Quick steppers for mobile */}
          <div className="flex space-x-1.5 pt-0.5">
            {[25, 50, 75, 100, 200].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuantity(amt)}
                className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition cursor-pointer ${
                  quantity === amt 
                    ? 'bg-[#2E7D32] text-white border-[#2E7D32]' 
                    : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                }`}
              >
                {amt}q
              </button>
            ))}
          </div>
        </div>

        {/* Quality Grade */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1F2937]">
            {t('quality_grade') || 'Quality Grade (गुणवत्ता)'}
          </label>
          <select
            value={qualityGrade}
            onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
            className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2E7D32] transition cursor-pointer"
          >
            <option value="Grade A (Export)">Grade A (Export Premium +3%)</option>
            <option value="Grade B (Premium)">Grade B (Standard Market)</option>
            <option value="Grade C (Standard)">Grade C (Fair Average -5%)</option>
          </select>
          <span className="text-[10px] text-[#6B7280] block">
            Higher quality fetches direct institutional premium rate
          </span>
        </div>

        {/* Max Travel Distance Radius */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1F2937] flex items-center justify-between">
            <span>{t('distance_radius') || 'Max Travel Distance'}</span>
            <span className="text-[#15803D] font-mono font-bold text-xs">{maxDistance} km</span>
          </label>
          <input
            type="range"
            min={20}
            max={400}
            step={10}
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-full accent-[#2E7D32] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#6B7280]">
            <span>20 km (Local)</span>
            <span>200 km</span>
            <span>400 km (State)</span>
          </div>
        </div>

      </div>

      {/* Recommended Best Market Highlight Card */}
      {bestResult && (
        <div className="clean-card p-5 sm:p-6 border-2 border-[#2E7D32] bg-[#F0FDF4] relative overflow-hidden space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            
            {/* Left Market Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2E7D32] text-white">
                  ★ {t('recommended_market')}
                </span>
                <span className="text-xs text-[#4B5563] font-medium">• 🚜 {bestResult.mandi.distanceKm} km away</span>
              </div>

              <h3 className="text-lg sm:text-2xl font-extrabold text-[#1F2937]">
                {bestResult.mandi.name} ({bestResult.mandi.district})
              </h3>

              <div className="flex items-center space-x-3 text-xs text-[#4B5563]">
                <span className="text-[#15803D] font-bold">
                  🏢 {bestResult.mandi.verifiedBuyersCount} Verified Buyers Ready
                </span>
                <span>•</span>
                <span>⭐ {bestResult.mandi.rating} Rating</span>
              </div>
            </div>

            {/* In-Hand Payout Summary Box */}
            <div className="bg-white p-4 rounded-2xl border-2 border-[#86EFAC] shadow-xs flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">
              <div>
                <div className="text-[11px] text-[#15803D] font-extrabold uppercase tracking-wide">
                  {t('in_hand_money')}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#15803D] font-mono mt-0.5">
                  ₹{bestResult.netRealization.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#166534] font-semibold">
                  ₹{bestResult.netRatePerQuintal}/quintal in your pocket
                </div>
              </div>

              <button
                onClick={() => handleSelectMarket(bestResult.mandi)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer touch-target"
              >
                <Building2 className="w-4 h-4" />
                <span>{t('view_buyers')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Toggle Button for Cost Details */}
          <div className="pt-2 border-t border-[#BBF7D0]">
            <button
              onClick={() => setShowCostDetails(!showCostDetails)}
              className="text-xs font-bold text-[#15803D] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{showCostDetails ? t('hide_cost_breakdown') : t('view_cost_breakdown')}</span>
              {showCostDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCostDetails && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-[#BBF7D0] text-xs mt-3">
                <div className="p-2">
                  <div className="text-[10px] text-[#6B7280]">Gross Market Rate</div>
                  <div className="text-sm font-bold text-[#1F2937] mt-0.5 font-mono">₹{bestResult.grossPricePerQuintal}/q</div>
                  <div className="text-[10px] text-[#6B7280]">₹{bestResult.grossRealization.toLocaleString('en-IN')} total</div>
                </div>

                <div className="p-2">
                  <div className="text-[10px] text-[#6B7280]">Freight Cost ({bestResult.mandi.distanceKm} km)</div>
                  <div className="text-sm font-bold text-[#DC2626] mt-0.5 font-mono">-₹{bestResult.freightCost.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-[#6B7280]">₹26/km fixed freight</div>
                </div>

                <div className="p-2">
                  <div className="text-[10px] text-[#6B7280]">Handling & Mandi Cess</div>
                  <div className="text-sm font-bold text-[#D97706] mt-0.5 font-mono">-₹{bestResult.handlingCost.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-[#6B7280]">{bestResult.mandi.mandiCessPercent}% APMC cess</div>
                </div>

                <div className="p-2 bg-[#DCFCE7] rounded-lg border border-[#86EFAC]">
                  <div className="text-[10px] text-[#15803D] font-bold">NET IN-HAND TOTAL</div>
                  <div className="text-base font-extrabold text-[#15803D] font-mono mt-0.5">
                    ₹{bestResult.netRealization.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#166534] font-semibold">100% Escrow protected</div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Alternative Market Realization Comparison Table */}
      <div>
        <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-3">
          {t('view_all_markets')} ({marketResults.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {marketResults.map((res, index) => (
            <div
              key={res.mandi.id}
              onClick={() => handleSelectMarket(res.mandi)}
              className={`p-4.5 rounded-2xl border transition-all cursor-pointer touch-target ${
                res.isRecommended
                  ? 'bg-[#F0FDF4] border-[#86EFAC] hover:border-[#2E7D32]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                    res.isRecommended ? 'bg-[#2E7D32] text-white' : 'bg-[#F3F4F6] text-[#4B5563]'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-[#1F2937] truncate max-w-[160px]">{res.mandi.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#6B7280]">🚜 {res.mandi.distanceKm} km</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs my-2.5 pt-2 border-t border-[#E5E7EB]">
                <div>
                  <div className="text-[10px] text-[#6B7280]">Offered Rate</div>
                  <div className="font-bold text-[#1F2937]">₹{res.grossPricePerQuintal}/q</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#15803D] font-bold">Net In-Hand</div>
                  <div className="font-extrabold text-[#15803D] font-mono text-sm">₹{res.netRealization.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                <span className="text-[#6B7280] font-medium">{res.mandi.verifiedBuyersCount} Buyers</span>
                <span className="text-[#2E7D32] font-bold flex items-center">
                  Select <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

