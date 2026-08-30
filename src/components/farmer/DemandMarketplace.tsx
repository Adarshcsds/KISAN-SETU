import React, { useEffect, useState } from 'react';
import { KisanSetuApi } from '../../services/api';
import { Store, Building2, ShieldCheck, CheckCircle2, XCircle, ArrowRight, Clock, Plus, RefreshCw } from 'lucide-react';
import { FarmerShipmentTracking } from './FarmerShipmentTracking';

const token = () => localStorage.getItem('kisansetu_access_token') || '';

export const DemandMarketplace: React.FC = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Selected demand for making an offer
  const [activeOfferDemand, setActiveOfferDemand] = useState<any | null>(null);
  const [offerQty, setOfferQty] = useState<number>(50);
  const [offerPrice, setOfferPrice] = useState<number>(2500);

  const load = async () => {
    setLoading(true);
    try {
      const [d, x, o] = await Promise.all([
        KisanSetuApi.getDemands(token()),
        KisanSetuApi.getDeals(token()),
        KisanSetuApi.getMyOffers(token())
      ]);
      setDemands(d);
      setDeals(x);
      setOffers(o);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openOfferModal = (d: any) => {
    setActiveOfferDemand(d);
    setOfferQty(d.quantityQuintals || 50);
    setOfferPrice(d.offeredPricePerQuintal || 2500);
  };

  const submitOffer = async () => {
    if (!activeOfferDemand || !offerQty || !offerPrice) return;
    try {
      await KisanSetuApi.createDemandOffer(token(), activeOfferDemand.id, {
        offeredQuantityQuintals: Number(offerQty),
        offeredPricePerQuintal: Number(offerPrice),
        qualityGrade: activeOfferDemand.qualityGrade || 'Grade A',
        message: 'Farmer offer via KisanSetu'
      });
      setActiveOfferDemand(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Offer submission failed');
    }
  };

  const respond = async (o: any, action: 'accept' | 'reject' | 'counter') => {
    try {
      let payload;
      if (action === 'counter') {
        const counterRate = Number(window.prompt('Enter your counter price (₹/Quintal):', String(o.offeredPricePerQuintal)) || 0);
        if (counterRate <= 0) return;
        payload = {
          offeredQuantityQuintals: o.offeredQuantityQuintals,
          offeredPricePerQuintal: counterRate,
          qualityGrade: o.qualityGrade,
          message: 'Farmer counter offer'
        };
      }
      await KisanSetuApi.respondToOffer(token(), o.id, action, payload);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1F2937] tracking-tight">
              Direct Buyer Demands (सीधी खरीद मांग)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
              VERIFIED BUYERS
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-0.5">
            Institutional buyers and flour mills seeking direct farm-gate procurement
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-xs font-bold text-[#4B5563] flex items-center space-x-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2E7D32]' : ''}`} />
          <span>Refresh Live</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#B91C1C] font-semibold">
          {error}
        </div>
      )}

      {/* Demands List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-3">
          Open Purchase Requisitions ({demands.length})
        </h3>

        {demands.length === 0 && !loading ? (
          <div className="clean-card p-8 text-center text-xs text-[#6B7280]">
            No live buyer demands active at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {demands.map((d) => (
              <div
                key={d.id}
                className="clean-card p-4.5 space-y-3 border border-[#E5E7EB] hover:border-[#2E7D32] transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1F2937]">{d.cropName}</h4>
                    <span className="text-[11px] text-[#6B7280]">{d.cropCategory}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                    ✓ Verified
                  </span>
                </div>

                <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-[#4B5563]">
                    <span>Buyer / Mill:</span>
                    <span className="font-bold text-[#1F2937]">{d.buyerFirmName || 'Verified Mill'}</span>
                  </div>
                  <div className="flex justify-between font-medium text-[#4B5563]">
                    <span>Required Qty:</span>
                    <span className="font-extrabold font-mono text-[#1F2937]">{d.quantityQuintals} Quintals</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#15803D] pt-1 border-t border-[#E5E7EB]">
                    <span>Offered Rate:</span>
                    <span className="font-mono text-sm">₹{d.offeredPricePerQuintal}/q</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#6B7280] space-y-0.5">
                  <div>Quality: <span className="font-semibold text-[#1F2937]">{d.qualityGrade}</span></div>
                  <div>Delivery: <span className="font-semibold text-[#1F2937]">{d.deliveryLocation}</span></div>
                </div>

                <button
                  onClick={() => openOfferModal(d)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-extrabold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer touch-target"
                >
                  <Plus className="w-4 h-4" />
                  <span>Send Offer (प्रस्ताव भेजें)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Offers & Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* My Sent Offers */}
        <div className="clean-card p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#2E7D32]" />
            <span>My Submitted Proposals (मेरे प्रस्ताव)</span>
          </h3>

          {offers.length === 0 ? (
            <p className="text-xs text-[#6B7280] py-4 text-center">No active proposals submitted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {offers.map((o) => (
                <div key={o.id} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-mono text-[#1F2937]">
                      {o.offeredQuantityQuintals} qtl @ ₹{o.offeredPricePerQuintal}/q
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      o.status === 'ACCEPTED' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  {o.status === 'COUNTERED' && (
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => respond(o, 'accept')}
                        className="px-2.5 py-1 rounded-lg bg-[#2E7D32] text-white text-[11px] font-bold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respond(o, 'counter')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#D1D5DB] text-[#1F2937] text-[11px] font-bold"
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => respond(o, 'reject')}
                        className="px-2.5 py-1 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-[11px] font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agreed Deals */}
        <div className="clean-card p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            <span>Agreed Deals & Logistics OTP</span>
          </h3>

          {deals.length === 0 ? (
            <p className="text-xs text-[#6B7280] py-4 text-center">No completed deals yet.</p>
          ) : (
            <div className="space-y-2.5">
              {deals.map((d) => (
                <div key={d.id} className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#1F2937]">{d.dealCode} · {d.cropName}</span>
                    <span className="text-[#15803D] font-mono">₹{d.grossAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[11px] text-[#4B5563]">
                    Logistics Handover Password: <code className="font-bold text-[#15803D] bg-white px-1.5 py-0.5 rounded border border-[#86EFAC]">{d.dealPassword}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
                </div>

        {/* Logistics Tracking - shown only after a logistics provider is assigned */}
        <FarmerShipmentTracking token={token()} />

      </div>

      {/* Offer Modal */}

      {/* Offer Modal */}
      {activeOfferDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#E5E7EB]">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Submit Offer to Buyer</h3>
                <p className="text-xs text-[#6B7280]">{activeOfferDemand.cropName} • {activeOfferDemand.buyerFirmName}</p>
              </div>
              <button
                onClick={() => setActiveOfferDemand(null)}
                className="text-[#6B7280] hover:text-[#1F2937] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Offered Quantity (Quintals)</label>
                <input
                  type="number"
                  value={offerQty}
                  onChange={(e) => setOfferQty(Number(e.target.value))}
                  className="w-full bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm font-bold text-[#1F2937]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Your Price per Quintal (₹/q)</label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  className="w-full bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm font-bold text-[#1F2937]"
                />
              </div>

              <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#15803D]">
                  <span>Total Payout:</span>
                  <span className="font-mono">₹{(offerQty * offerPrice).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[10px] text-[#166534]">Payment secured by KisanSetu escrow</div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setActiveOfferDemand(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-bold text-[#4B5563] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitOffer}
                className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-extrabold cursor-pointer"
              >
                Confirm & Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

