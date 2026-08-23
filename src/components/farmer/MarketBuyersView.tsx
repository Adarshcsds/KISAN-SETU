import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MandiMarket, VerifiedBuyer } from '../../types';
import { SendOrderModal } from './SendOrderModal';
import { 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  Star, 
  Clock, 
  MapPin, 
  Warehouse, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle2, 
  Send, 
  Sparkles,
  Phone,
  Truck
} from 'lucide-react';

interface MarketBuyersViewProps {
  mandi: MandiMarket;
  onBack: () => void;
}

export const MarketBuyersView: React.FC<MarketBuyersViewProps> = ({ mandi, onBack }) => {
  const { buyers, selectedCrop, setActiveTab, setDispatchingOrderId } = useApp();
  const [selectedBuyerForOrder, setSelectedBuyerForOrder] = useState<VerifiedBuyer | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Filter buyers for this mandi (or regional verified buyers matching this mandi/crop)
  const mandiBuyers = buyers.filter(b => {
    const matchesMandi = b.mandiId === mandi.id || b.acceptedCrops.includes(selectedCrop.id);
    const matchesCrop = filterCrop === 'all' || b.acceptedCrops.includes(filterCrop);
    const matchesType = filterType === 'all' || b.type === filterType;
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMandi && matchesCrop && matchesType && matchesSearch;
  });

  const handleOrderSuccess = (orderId: string) => {
    setSelectedBuyerForOrder(null);
    setActiveTab('orders');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#1F2937] border border-[#D1D5DB] transition flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-2xl font-bold text-[#1F2937]">
                Market Details & Buyers: <span className="text-[#2E7D32]">{mandi.name}</span>
              </h1>
            </div>
            <p className="text-xs text-[#4B5563]">
              {mandi.district}, {mandi.state} • {mandi.distanceKm} km from your farm gate
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#15803D]" /> Live Trading Active
          </span>
        </div>
      </div>

      {/* Main Grid: Left Market Statistics | Right Buyers Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Mandi Statistics & Infrastructure (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Mandi Profile Card */}
          <div className="clean-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider flex items-center space-x-2">
              <Warehouse className="w-4 h-4 text-[#2E7D32]" />
              <span>Market Statistics & Capacity</span>
            </h3>

            {/* Arrival Volume */}
            <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#6B7280] font-medium">
                <span>Arrival Volume Today</span>
                <span className="text-[#15803D] font-mono text-[11px] font-bold">+{mandi.arrivalTrendPercent}% vs avg</span>
              </div>
              <div className="text-xl font-extrabold text-[#1F2937] font-mono">
                {mandi.arrivalTodayQuintals.toLocaleString('en-IN')} Qtl
              </div>
              <div className="text-[11px] text-[#6B7280] flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
                <span>Wheat: 7,800 Qtl</span>
                <span>Soyabean: 4,200 Qtl</span>
              </div>
            </div>

            {/* Average Rates */}
            <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="text-xs text-[#6B7280] font-semibold">Modal Average Rates</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563]">Wheat (Lokwan):</span>
                  <span className="font-bold text-[#1F2937] font-mono">₹{mandi.modalPrice}/q</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563]">Soyabean (Yellow):</span>
                  <span className="font-bold text-[#1F2937] font-mono">₹5,120/q</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4B5563]">Onion (Red):</span>
                  <span className="font-bold text-[#1F2937] font-mono">₹2,850/q</span>
                </div>
              </div>
            </div>

            {/* Storage & Cold Chain */}
            <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280] font-medium">Storage Capacity</span>
                <span className="text-[#15803D] font-bold">
                  {mandi.storageCapacityAvailableQuintals.toLocaleString('en-IN')} Qtl Free
                </span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div className="bg-[#2E7D32] h-full rounded-full" style={{ width: '74%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#4B5563] pt-1 font-medium">
                <span>WDRA Approved Silo</span>
                <span>{mandi.coldStorageAvailable ? '✅ Cold Chain' : '❌ No Cold Chain'}</span>
              </div>
            </div>

            {/* Market Cess & Tax Info */}
            <div className="p-3 bg-[#F9FAFB] rounded-xl text-[11px] text-[#4B5563] space-y-1 border border-[#E5E7EB]">
              <div className="flex justify-between">
                <span>APMC Mandi Cess:</span>
                <span className="text-[#1F2937] font-mono font-bold">{mandi.mandiCessPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Handling & Porterage:</span>
                <span className="text-[#1F2937] font-mono font-bold">₹{mandi.avgHandlingCostPerQuintal}/Qtl</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Verified Buyers & Institutional Traders (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filter and Search Bar */}
          <div className="clean-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search buyer or mill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={filterCrop}
                onChange={(e) => setFilterCrop(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Crops</option>
                <option value="wheat">Wheat</option>
                <option value="soyabean">Soyabean</option>
                <option value="onion">Onion</option>
                <option value="cotton">Cotton</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Buyer Types</option>
                <option value="Flour Mill">Flour Mill</option>
                <option value="Processor">Processor</option>
                <option value="Institutional Exporter">Exporter</option>
                <option value="FMCG Corporate">FMCG Corporate</option>
              </select>
            </div>
          </div>

          {/* Buyers List Cards */}
          <div className="space-y-3.5">
            {mandiBuyers.length === 0 ? (
              <div className="clean-card p-8 text-center text-[#6B7280] space-y-2">
                <Building2 className="w-8 h-8 mx-auto text-[#9CA3AF]" />
                <p className="text-sm font-bold text-[#1F2937]">No buyers matched your current filter criteria.</p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterCrop('all'); setFilterType('all'); }}
                  className="text-xs text-[#2E7D32] underline font-bold cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              mandiBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="clean-card p-5 space-y-4"
                >
                  {/* Buyer Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2E7D32] font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-[#1F2937] tracking-tight">
                            {buyer.name}
                          </h4>
                          {buyer.verifiedBadge && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                              <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified Buyer
                            </span>
                          )}
                          {buyer.isoCertified && (
                            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] font-bold">
                              ISO 9001
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4B5563] font-medium">
                          {buyer.type} • {buyer.companyName}
                        </p>
                      </div>
                    </div>

                    {/* Offered Rate Badge */}
                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                      <div className="text-xs text-[#6B7280] font-medium">Offered Rate</div>
                      <div className="text-lg font-extrabold text-[#15803D] font-mono">
                        ₹{buyer.offeredRatePerQuintal.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#6B7280]">/q</span>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Specs & Volume Intake */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] text-xs">
                    <div>
                      <div className="text-[10px] text-[#6B7280]">Accepted Volume Range</div>
                      <div className="font-bold text-[#1F2937] mt-0.5">
                        {buyer.minVolumeQuintals} - {buyer.maxVolumeQuintals.toLocaleString('en-IN')} Quintals
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#6B7280]">Payment Reliability</div>
                      <div className="font-bold text-[#15803D] flex items-center mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>{buyer.paymentReliabilityPercent}% On-Time (~{buyer.avgPaymentReleaseHours}h)</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#6B7280]">Buyer Rating</div>
                      <div className="font-bold text-[#B45309] flex items-center mt-0.5">
                        <Star className="w-3.5 h-3.5 mr-1 fill-[#F59E0B] text-[#F59E0B]" />
                        <span>{buyer.rating} ({buyer.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Requirements */}
                  <div className="text-xs text-[#4B5563] bg-[#F0FDF4] p-2.5 rounded-xl border border-[#86EFAC] flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#15803D]">Quality Specs: </span>
                      <span className="text-[#1F2937] font-medium">{buyer.qualitySpecs} (Max moisture: {buyer.maxMoistureAllowed}%)</span>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#E5E7EB]">
                    <div className="flex items-center space-x-3 text-xs text-[#4B5563]">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-[#9CA3AF]" /> {buyer.deliveryLocation}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedBuyerForOrder(buyer)}
                      className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Order Request</span>
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Send Order Request Modal */}
      {selectedBuyerForOrder && (
        <SendOrderModal
          buyer={selectedBuyerForOrder}
          mandi={mandi}
          onClose={() => setSelectedBuyerForOrder(null)}
          onSuccess={handleOrderSuccess}
        />
      )}

    </div>
  );
};
