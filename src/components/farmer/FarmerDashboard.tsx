import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SmartMarketPredictor } from './SmartMarketPredictor';
import { PriceIntelligenceCard } from './PriceIntelligenceCard';
import { MaxProfitOptimizerCard } from './MaxProfitOptimizerCard';
import { KisanSetuAssistant } from './KisanSetuAssistant';
import { HISTORICAL_FORECAST_DATA } from '../../data/mockData';
import { MandiMarket } from '../../types';
import { 
  Sprout, 
  MapPin, 
  TrendingUp, 
  Warehouse, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Scan, 
  PackageCheck,
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  ArrowUpRight,
  Wallet,
  Truck,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle
} from 'lucide-react';

interface FarmerDashboardProps {
  onOpenQualityAssessor: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onOpenQualityAssessor }) => {
  const { 
    currentUser,
    mandis, 
    commodities, 
    selectedCrop, 
    selectedCropId,
    setSelectedCropId, 
    setViewingMandiBuyers, 
    orders, 
    farmerWalletBalance,
    setActiveTab, 
    t 
  } = useApp();

  const [expandedSection, setExpandedSection] = useState<'all' | 'forecast' | 'calculator' | 'comparison' | 'none'>('all');

  const acceptedOrdersCount = orders.filter(o => o.status === 'accepted').length;
  const inTransitCount = orders.filter(o => o.status === 'dispatched').length;
  const pendingBuyerPos = orders.filter(o => o.orderOrigin === 'buyer_direct_po' && o.status === 'pending');

  // Compute Best Mandi and Net In-Hand for selected crop
  const bestMandiInfo = useMemo(() => {
    if (!mandis || mandis.length === 0) return null;
    
    // Sort mandis by highest modal price adjusted for distance
    const sorted = [...mandis].map(mandi => {
      const gross = selectedCrop.currentAvgPrice + (mandi.modalPrice - 2450) * 0.8;
      const freight = Math.round(600 + (mandi.distanceKm * 26)) / 75; // freight per quintal on 75q lot
      const handling = mandi.avgHandlingCostPerQuintal + (gross * (mandi.mandiCessPercent / 100));
      const netPerQtl = Math.round(gross - freight - handling);
      return {
        mandi,
        grossPrice: Math.round(gross),
        netPerQtl,
        distanceKm: mandi.distanceKm
      };
    }).sort((a, b) => b.netPerQtl - a.netPerQtl);

    return sorted[0] || null;
  }, [mandis, selectedCrop]);

  // Compute Forecast and Decision
  const forecastData = HISTORICAL_FORECAST_DATA[selectedCropId] || HISTORICAL_FORECAST_DATA['wheat'] || [];
  const expectedFuturePrice = forecastData[forecastData.length - 1]?.forecastPrice || Math.round(selectedCrop.currentAvgPrice * 1.08);
  const priceDifference = Math.round(expectedFuturePrice - selectedCrop.currentAvgPrice);
  const isSurgeExpected = priceDifference > 50 && selectedCrop.shelfLifeDays > 45;

  const toggleSection = (section: 'forecast' | 'calculator' | 'comparison') => {
    setExpandedSection(prev => prev === section ? 'none' : section);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Welcome Strip */}
      <div className="clean-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-[#E5E7EB] shadow-xs">
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D] text-2xl shadow-xs flex-shrink-0">
            🌾
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#1F2937] tracking-tight">
                Namaste, {currentUser.name.split(' ')[0]} ji!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                🌾 {t('farmer_role')}
              </span>
            </div>
            <p className="text-xs text-[#4B5563] flex items-center space-x-1.5 mt-0.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
              <span>{currentUser.location || 'Niphad'}, {currentUser.district || 'Nashik'} • {currentUser.farmSizeAcres || 5} Acres</span>
            </p>
          </div>
        </div>

        {/* Action Badges / Alerts */}
        <div className="flex flex-wrap items-center gap-2">
          {pendingBuyerPos.length > 0 && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-3.5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition cursor-pointer touch-target"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{pendingBuyerPos.length} Direct Order(s)</span>
            </button>
          )}

          {acceptedOrdersCount > 0 && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition cursor-pointer touch-target"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{acceptedOrdersCount} Ready to Dispatch</span>
            </button>
          )}

          <div className="bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-[#15803D]" />
            <div>
              <div className="text-[10px] text-[#166534] font-semibold">{t('farmer_wallet')}</div>
              <div className="text-xs font-extrabold text-[#15803D] font-mono">₹{farmerWalletBalance.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. 🌟 KISANSETU 5-10 SECOND HERO DECISION CARD */}
      <div className="clean-card p-5 sm:p-7 border-2 border-[#2E7D32] bg-gradient-to-b from-[#F0FDF4] via-white to-white shadow-md space-y-5">
        
        {/* Step A: Simple Crop Selector Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-[#1F2937] flex items-center space-x-1.5">
              <span className="text-[#15803D] font-extrabold">1.</span>
              <span>{t('select_crop_label') || 'अपनी फसल चुनें / Choose Crop:'}</span>
            </label>
            <span className="text-[11px] text-[#4B5563] font-medium hidden sm:inline">
              Tap any crop to see live price & advice
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {commodities.map((c) => {
              const isSelected = selectedCropId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCropId(c.id)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer touch-target ${
                    isSelected
                      ? 'bg-[#2E7D32] text-white shadow-md shadow-emerald-950/20 scale-[1.02] border-2 border-[#1E5128]'
                      : 'bg-white text-[#1F2937] hover:bg-[#F3F4F6] border border-[#D1D5DB] hover:border-[#9CA3AF]'
                  }`}
                >
                  <span className="text-2xl mb-1">{c.icon}</span>
                  <span className="text-xs font-extrabold truncate w-full">{c.hindiName || c.name.split(' ')[0]}</span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-[#DCFCE7]' : 'text-[#4B5563]'}`}>
                    {c.name.split(' ')[0]}
                  </span>
                  <span className={`text-xs font-mono font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-[#15803D]'}`}>
                    ₹{c.currentAvgPrice}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step B: The 4 Core Farmer Numbers (Visible in 5 seconds) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          
          {/* Card 1: Today's Mandi Price */}
          <div className="bg-white p-4.5 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#2E7D32] transition shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4B5563] flex items-center space-x-1">
                <span>💰</span>
                <span>{t('today_mandi_price')}</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                selectedCrop.change24h >= 0 ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}>
                {selectedCrop.change24h >= 0 ? `+${selectedCrop.change24h}%` : `${selectedCrop.change24h}%`}
              </span>
            </div>
            
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] stat-number font-mono">
              ₹{selectedCrop.currentAvgPrice.toLocaleString('en-IN')}<span className="text-xs text-[#6B7280] font-normal"> / quintal</span>
            </div>

            <div className="text-[11px] text-[#4B5563] pt-1 border-t border-[#F3F4F6] flex justify-between font-medium">
              <span>Govt. MSP:</span>
              <span className="font-bold text-[#1F2937]">₹{selectedCrop.msp > 0 ? `${selectedCrop.msp}/q` : 'Market rate'}</span>
            </div>
          </div>

          {/* Card 2: Expected Future Price (AI Forecast) */}
          <div className="bg-white p-4.5 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#2E7D32] transition shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4B5563] flex items-center space-x-1">
                <span>📈</span>
                <span>{t('expected_price')}</span>
              </span>
              <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                15-30 Days AI
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#15803D] stat-number font-mono">
              ₹{expectedFuturePrice.toLocaleString('en-IN')}<span className="text-xs text-[#6B7280] font-normal"> / quintal</span>
            </div>

            <div className="text-[11px] text-[#166534] pt-1 border-t border-[#F3F4F6] flex justify-between font-semibold">
              <span>Expected Outlook:</span>
              <span>{priceDifference >= 0 ? `+₹${priceDifference}/q surge` : `Stable rate`}</span>
            </div>
          </div>

          {/* Card 3: Best Mandi & Distance */}
          <div className="bg-[#F0FDF4] p-4.5 rounded-2xl border-2 border-[#86EFAC] transition shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#15803D] flex items-center space-x-1">
                <span>📍</span>
                <span>{t('best_mandi')}</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-[#15803D] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                🚜 {bestMandiInfo?.distanceKm || 58} km
              </span>
            </div>

            <div className="text-lg sm:text-xl font-extrabold text-[#1F2937] truncate">
              {bestMandiInfo?.mandi.name || 'Pune APMC Market'}
            </div>

            <div className="text-[11px] text-[#15803D] pt-1 border-t border-[#BBF7D0] flex justify-between font-bold">
              <span>Net in hand:</span>
              <span className="font-mono">₹{bestMandiInfo?.netPerQtl || selectedCrop.currentAvgPrice}/q</span>
            </div>
          </div>

          {/* Card 4: 1-Tap Quick Action */}
          <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E7EB] flex flex-col justify-between space-y-2">
            <span className="text-xs font-bold text-[#4B5563] flex items-center space-x-1">
              <span>⚡</span>
              <span>{t('quick_actions')}</span>
            </span>

            <button
              onClick={() => {
                if (bestMandiInfo?.mandi) {
                  setViewingMandiBuyers(bestMandiInfo.mandi);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition cursor-pointer touch-target"
            >
              <Building2 className="w-4 h-4" />
              <span>{t('direct_sell')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={onOpenQualityAssessor}
                className="py-1.5 px-2 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] text-[11px] font-bold border border-[#D1D5DB] flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Quality Check</span>
              </button>

              <button
                onClick={() => {
                  const storageBtn = document.querySelector('[data-storage-btn]') as HTMLButtonElement;
                  if (storageBtn) storageBtn.click();
                }}
                className="py-1.5 px-2 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] text-[11px] font-bold border border-[#D1D5DB] flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Warehouse className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Find Storage</span>
              </button>
            </div>
          </div>

        </div>

        {/* Step C: 💡 The Clear Farmer Recommendation Banner */}
        <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isSurgeExpected 
            ? 'bg-[#FEFCE8] border-[#FACC15] glow-amber' 
            : 'bg-[#F0FDF4] border-[#86EFAC] glow-success'
        }`}>
          <div className="flex items-start space-x-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5 ${
              isSurgeExpected ? 'bg-[#FEF08A] text-[#854D0E]' : 'bg-[#DCFCE7] text-[#15803D]'
            }`}>
              {isSurgeExpected ? '⏳' : '✅'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#4B5563]">
                  {t('recommendation')}
                </span>
                <span className="text-xs font-bold font-mono text-[#15803D]">
                  94% Confidence
                </span>
              </div>
              <h3 className={`text-base sm:text-lg font-extrabold mt-1 ${
                isSurgeExpected ? 'text-[#854D0E]' : 'text-[#166534]'
              }`}>
                {isSurgeExpected 
                  ? t('recommendation_hold')
                  : t('recommendation_sell')
                }
              </h3>
              <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed font-medium">
                {isSurgeExpected 
                  ? `${t('recommendation_hold_sub')} (Expected gain: +₹${priceDifference}/q over next 2-3 weeks)`
                  : `${t('recommendation_sell_sub')} (Best market: ${bestMandiInfo?.mandi.name || 'Pune APMC'})`
                }
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center space-x-2">
            <button
              onClick={() => {
                if (bestMandiInfo?.mandi) {
                  setViewingMandiBuyers(bestMandiInfo.mandi);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition cursor-pointer touch-target"
            >
              <span>{isSurgeExpected ? 'Explore Storage & Advance' : 'Sell to Best Mandi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. Progressive Disclosure Accordion Sections for In-Depth Information */}
      <div className="space-y-4">
        
        {/* Section 1: Price Trends & 30-Day AI Forecast */}
        <div className="clean-card overflow-hidden">
          <div 
            onClick={() => toggleSection('forecast')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] transition bg-white border-b border-[#E5E7EB]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
                  {t('price_trends')}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  View historical graph, arrivals volume, and 30-day forecast details
                </p>
              </div>
            </div>
            <button className="p-1 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]">
              {expandedSection === 'all' || expandedSection === 'forecast' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {(expandedSection === 'all' || expandedSection === 'forecast') && (
            <div className="p-4 sm:p-6 bg-white">
              <PriceIntelligenceCard />
            </div>
          )}
        </div>

        {/* Section 2: AI Net Profit Calculator & Mandi Comparison */}
        <div className="clean-card overflow-hidden">
          <div 
            onClick={() => toggleSection('calculator')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] transition bg-white border-b border-[#E5E7EB]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
                  {t('ai_predictor_title')}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Calculate your true net in-pocket earnings after transport distance & handling
                </p>
              </div>
            </div>
            <button className="p-1 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]">
              {expandedSection === 'all' || expandedSection === 'calculator' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {(expandedSection === 'all' || expandedSection === 'calculator') && (
            <div className="p-4 sm:p-6 bg-white">
              <SmartMarketPredictor />
            </div>
          )}
        </div>

        {/* Section 3: 3-Way Profit Maximizer (Eliminate Middlemen) */}
        <div className="clean-card overflow-hidden">
          <div 
            onClick={() => toggleSection('comparison')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] transition bg-white border-b border-[#E5E7EB]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">
                  3-Way Profit Maximizer vs Traditional Broker Sale
                </h3>
                <p className="text-xs text-[#6B7280]">
                  How KisanSetu saves +18% extra profit by eliminating cuts and weighbridge losses
                </p>
              </div>
            </div>
            <button className="p-1 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]">
              {expandedSection === 'all' || expandedSection === 'comparison' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {(expandedSection === 'all' || expandedSection === 'comparison') && (
            <div className="p-4 sm:p-6 bg-white">
              <MaxProfitOptimizerCard />
            </div>
          )}
        </div>

      </div>

      {/* 4. KisanSetu Assistant */}
      <KisanSetuAssistant />

      {/* 5. All Regional APMC Mandis Directory */}
      <div className="clean-card p-5 sm:p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
              {t('nearby_mandis')} ({mandis.length} Active Hubs)
            </h2>
            <p className="text-xs text-[#4B5563]">
              Direct verified buyers, cold storage facilities, and live modal rates in your region
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {mandis.map((mandi) => (
            <div
              key={mandi.id}
              className="bg-[#F9FAFB] p-4.5 rounded-2xl border border-[#E5E7EB] hover:border-[#2E7D32] transition space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2937]">{mandi.name}</h4>
                  <p className="text-[11px] text-[#6B7280]">{mandi.district}, {mandi.state}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
                  {mandi.distanceKm} km
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-[#E5E7EB]">
                <div>
                  <div className="text-[10px] text-[#6B7280] font-medium">Today's Modal Rate</div>
                  <div className="font-extrabold text-[#1F2937] font-mono text-sm">₹{mandi.modalPrice}/q</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280] font-medium">Verified Buyers</div>
                  <div className="font-bold text-[#2E7D32] text-sm">{mandi.verifiedBuyersCount} Active</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#4B5563] font-medium">
                  {mandi.coldStorageAvailable ? '❄️ Cold storage ready' : '📦 Dry storage ready'}
                </span>

                <button
                  onClick={() => setViewingMandiBuyers(mandi)}
                  className="px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold flex items-center space-x-1 transition cursor-pointer touch-target shadow-xs"
                >
                  <span>Explore Buyers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

