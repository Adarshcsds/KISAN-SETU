import React from 'react';
import { useApp } from '../../context/AppContext';
import { SmartMarketPredictor } from './SmartMarketPredictor';
import { PriceIntelligenceCard } from './PriceIntelligenceCard';
import { MaxProfitOptimizerCard } from './MaxProfitOptimizerCard';
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
  DollarSign
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

  const acceptedOrdersCount = orders.filter(o => o.status === 'accepted').length;
  const inTransitCount = orders.filter(o => o.status === 'dispatched').length;
  const pendingBuyerPos = orders.filter(o => o.orderOrigin === 'buyer_direct_po' && o.status === 'pending');

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Quick Profile */}
      <div className="clean-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
              Namaste, {currentUser.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
              {currentUser.role === 'farmer' ? '🌾 Verified Farmer' : 'Member'}
            </span>
          </div>
          <p className="text-xs text-[#4B5563] flex items-center space-x-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
            <span>{currentUser.location}, {currentUser.district}, {currentUser.state} • {currentUser.farmSizeAcres || 5} Acres</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {pendingBuyerPos.length > 0 && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-4 py-2 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{pendingBuyerPos.length} Direct Buy Order(s) Received</span>
            </button>
          )}

          {acceptedOrdersCount > 0 && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{acceptedOrdersCount} Ready to Dispatch</span>
            </button>
          )}

          <button
            onClick={onOpenQualityAssessor}
            className="btn-secondary text-xs cursor-pointer font-bold"
          >
            <Scan className="w-4 h-4 text-[#2E7D32]" />
            <span>AI Quality Check</span>
          </button>
        </div>

      </div>

      {/* 2. Key High-Impact Metrics Strip (Clean 4-Box Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Selected Crop Price */}
        <div className="clean-card clean-card-hover p-4.5">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>{selectedCrop.name.split(' ')[0]} Benchmark</span>
            <span className={`text-[11px] font-bold ${selectedCrop.change24h >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
              {selectedCrop.change24h >= 0 ? `+${selectedCrop.change24h}%` : `${selectedCrop.change24h}%`}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F2937] stat-number mt-1.5">
            ₹{selectedCrop.currentAvgPrice.toLocaleString('en-IN')}<span className="text-xs text-[#6B7280] font-normal">/q</span>
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1 font-medium">
            MSP: ₹{selectedCrop.msp > 0 ? `${selectedCrop.msp}/q` : 'Market rate'}
          </div>
        </div>

        {/* Metric 2: Highest Net Profit Mandi */}
        <div className="clean-card clean-card-hover p-4.5 bg-[#F0FDF4] border-[#BBF7D0]">
          <div className="flex items-center justify-between text-xs text-[#15803D] font-bold">
            <span>Highest Net Profit</span>
            <span className="text-[10px] bg-[#DCFCE7] px-2 py-0.5 rounded text-[#15803D] border border-[#86EFAC]">
              #1 Recommended
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#15803D] stat-number mt-1.5">
            Pune APMC Hub
          </div>
          <div className="text-[11px] text-[#166534] mt-1 font-semibold">
            Est. Net: ₹2,423/q (After Freight)
          </div>
        </div>

        {/* Metric 3: Active In-Transit Vehicles */}
        <div className="clean-card clean-card-hover p-4.5">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>Vehicles On Route</span>
            <Truck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F2937] stat-number mt-1.5">
            {inTransitCount} <span className="text-xs text-[#6B7280] font-normal">Active Truck(s)</span>
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1 font-medium">
            {inTransitCount > 0 ? 'Live GPS Tracking Active' : 'No dispatches in transit'}
          </div>
        </div>

        {/* Metric 4: Direct Settled Balance */}
        <div className="clean-card clean-card-hover p-4.5">
          <div className="flex items-center justify-between text-xs text-[#4B5563] font-medium">
            <span>Bank Account Payouts</span>
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#15803D] stat-number mt-1.5">
            ₹{farmerWalletBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#166534] mt-1 font-semibold">
            Instant Escrow Verified
          </div>
        </div>

      </div>

      {/* 3. Crop Selection Strip */}
      <div className="clean-card p-3">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="text-xs font-bold text-[#4B5563] uppercase tracking-wider px-2 flex-shrink-0">
            Select Crop:
          </div>
          {commodities.map((c) => {
            const isSelected = selectedCropId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCropId(c.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-[#F3F4F6] text-[#1F2937] hover:bg-[#E5E7EB] border border-[#E5E7EB]'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name.split(' ')[0]}</span>
                <span className={`text-[11px] ${isSelected ? 'text-white font-mono' : 'text-[#4B5563] font-mono'}`}>
                  ₹{c.currentAvgPrice}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. AI Realization Engine & Market Ranking */}
      <SmartMarketPredictor />

      {/* 5. 3-Way Profit Maximizer & Loss Minimizer */}
      <MaxProfitOptimizerCard />

      {/* 6. Price Trends & AI Forecast */}
      <PriceIntelligenceCard />

      {/* 7. Nearby Mandis Directory */}
      <div className="clean-card p-5 sm:p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
              Nearby APMC Mandis ({mandis.length} Active Hubs)
            </h2>
            <p className="text-xs text-[#4B5563]">
              Direct institutional buyers and storage facilities located near your farm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {mandis.map((mandi) => (
            <div
              key={mandi.id}
              className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] hover:border-[#2E7D32] transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2937]">{mandi.name}</h4>
                  <p className="text-[11px] text-[#6B7280]">{mandi.district}, {mandi.state}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                  {mandi.distanceKm} km
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
                <div>
                  <div className="text-[10px] text-[#6B7280]">Today's Modal Rate</div>
                  <div className="font-bold text-[#1F2937] font-mono">₹{mandi.modalPrice}/q</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280]">Verified Buyers</div>
                  <div className="font-bold text-[#2E7D32]">{mandi.verifiedBuyersCount} Active</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#4B5563]">
                  {mandi.coldStorageAvailable ? '❄️ Cold storage ready' : '📦 Dry storage'}
                </span>

                <button
                  onClick={() => setViewingMandiBuyers(mandi)}
                  className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
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
