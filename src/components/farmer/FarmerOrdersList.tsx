import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderRequest } from '../../types';
import { VehicleDispatchModal } from './VehicleDispatchModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { OrderSupportActions } from '../support/SupportModule';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowUpRight, 
  MapPin, 
  Phone, 
  QrCode, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Receipt,
  FileCheck,
  Check
} from 'lucide-react';

export const FarmerOrdersList: React.FC = () => {
  const { 
    orders, 
    dispatchingOrderId, 
    setDispatchingOrderId, 
    farmerAcceptBuyerOrder,
    rejectOrder,
    t 
  } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderRequest | null>(null);

  const filteredOrders = orders.filter(o => {
    if (selectedFilter === 'all') return true;
    return o.status === selectedFilter;
  });

  const getStatusBadge = (status: OrderRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
            <Clock className="w-3 h-3 mr-1" /> {t('status_pending')}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
            <CheckCircle2 className="w-3 h-3 mr-1 text-[#15803D]" /> {t('status_accepted')}
          </span>
        );
      case 'countered':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]">
            <AlertCircle className="w-3 h-3 mr-1" /> Counter Offer Received
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]">
            <Truck className="w-3 h-3 mr-1" /> {t('status_dispatched')}
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {t('status_delivered')}
          </span>
        );
      case 'settled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
            <ShieldCheck className="w-3 h-3 mr-1 text-[#15803D]" /> {t('status_settled')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
    }
  };

  const activeDispatchOrder = orders.find(o => o.id === dispatchingOrderId);

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
            Trade Orders & Logistics Dashboard
          </h1>
          <p className="text-xs text-[#4B5563]">
            Monitor buyer proposals, load vehicles with digital gate passes, and track bank escrow payouts
          </p>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {['all', 'pending', 'accepted', 'dispatched', 'settled'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                selectedFilter === f
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="clean-card p-10 text-center text-[#6B7280] space-y-2">
            <Package className="w-10 h-10 mx-auto text-[#9CA3AF]" />
            <p className="text-sm font-bold text-[#1F2937]">No trade orders found in this category.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`clean-card p-5 sm:p-6 transition-all ${
                order.status === 'accepted'
                  ? 'border-[#86EFAC] bg-[#F0FDF4]'
                  : 'bg-white'
              }`}
            >
              {/* Top Row: Order ID, Crop, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#E5E7EB]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2E7D32] font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-[#1F2937]">{order.id}</span>
                      {order.orderOrigin === 'buyer_direct_po' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                          🏢 Direct Buyer Buy Order
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                          🌾 Farmer Proposal
                        </span>
                      )}
                      <span className="text-xs text-[#6B7280]">• {order.createdAt}</span>
                    </div>
                    <div className="text-xs text-[#4B5563] font-bold mt-0.5">
                      {order.cropName} ({order.variety}) • <span className="text-[#2E7D32] font-extrabold">{order.quantityQuintals} Quintals</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Middle Row: Buyer & Realization Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3.5 text-xs">
                <div>
                  <div className="text-[10px] text-[#6B7280]">Buyer & Destination</div>
                  <div className="font-bold text-[#1F2937] mt-0.5">{order.buyerCompany}</div>
                  <div className="text-[11px] text-[#4B5563] flex items-center mt-0.5">
                    <MapPin className="w-3 h-3 mr-1 text-[#9CA3AF]" />
                    <span>{order.targetMarketName}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#6B7280]">Offered Rate & Quality</div>
                  <div className="font-bold text-[#15803D] mt-0.5">
                    ₹{order.proposedPricePerQuintal}/q • {order.qualityGrade.split(' ')[0]}
                  </div>
                  <div className="text-[11px] text-[#4B5563] mt-0.5">
                    Moisture: {order.moisturePercent}% • Loss Buffer: {order.expectedLossPercent}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#6B7280]">Calculated Net Payout</div>
                  <div className="text-base font-extrabold text-[#15803D] font-mono mt-0.5">
                    ₹{order.calculatedNetRealization.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-mono">
                    Gross: ₹{order.grossAmount.toLocaleString('en-IN')} (Freight: -₹{order.freightCost})
                  </div>
                </div>
              </div>

              {order.buyerNotes && (
                <div className="text-xs text-[#92400E] bg-[#FEF3C7] p-2.5 rounded-xl border border-[#FCD34D] my-2 font-medium">
                  <span className="font-bold text-[#B45309]">Buyer Note: </span>
                  {order.buyerNotes}
                </div>
              )}

              {/* Conditional Alert & Action Row */}
              
              {/* 1. If Direct Buyer PO in Pending: Allow Farmer to Accept Direct PO */}
              {order.orderOrigin === 'buyer_direct_po' && order.status === 'pending' && (
                <div className="mt-3 p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FCD34D] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs text-[#92400E]">
                    <Sparkles className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                    <span>
                      <strong>Buyer placed direct purchase order!</strong> Accepting this locks buyer's escrow funds at ₹{order.proposedPricePerQuintal}/q.
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => rejectOrder(order.id, 'Farmer declined direct order')}
                      className="px-4 py-2 rounded-xl bg-white text-[#4B5563] hover:text-[#1F2937] text-xs font-bold border border-[#D1D5DB] cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => farmerAcceptBuyerOrder(order.id)}
                      className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Buy Order</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. If Accepted: Show prominent Load Vehicle CTA */}
              {order.status === 'accepted' && (
                <div className="mt-3 p-3.5 bg-[#DCFCE7] rounded-xl border border-[#86EFAC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs text-[#15803D]">
                    <Sparkles className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                    <span>
                      <strong>Order is Confirmed!</strong> Assign transporter and load vehicle to dispatch.
                    </span>
                  </div>

                  <button
                    onClick={() => setDispatchingOrderId(order.id)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Load Vehicle & Dispatch</span>
                  </button>
                </div>
              )}

              {/* 3. If In Transit: Show Live GPS Tracker Bar */}
              {order.status === 'dispatched' && order.dispatchDetails && (
                <div className="mt-3 p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-[#2563EB] animate-bounce" />
                      <span className="font-bold text-[#1F2937]">
                        Live GPS Telemetry: {order.dispatchDetails.truckType} ({order.dispatchDetails.licensePlate})
                      </span>
                    </div>
                    <div className="font-mono text-[#1D4ED8] font-bold">
                      ETA: {order.dispatchDetails.etaMinutes} mins remaining ({order.dispatchDetails.distanceKm} km)
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2563EB] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${order.dispatchDetails.currentGpsProgressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#4B5563] font-mono pt-1 font-medium">
                    <span>Origin: {order.dispatchDetails.originLocation}</span>
                    <span className="text-[#2563EB] font-bold">Driver: {order.dispatchDetails.driverName} ({order.dispatchDetails.driverPhone})</span>
                    <span>Gate: {order.dispatchDetails.gatePassId}</span>
                  </div>
                </div>
              )}

              {/* 4. If Settled: Show Payout Receipt button & UTR reference */}
              {order.status === 'settled' && (
                <div className="mt-3 p-3.5 bg-[#F0FDF4] rounded-xl border border-[#86EFAC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-[#15803D]">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D] flex-shrink-0" />
                    <div>
                      <div className="font-bold text-[#1F2937]">
                        ₹{order.calculatedNetRealization.toLocaleString('en-IN')} Credited to Your Bank Account
                      </div>
                      <div className="text-[11px] text-[#4B5563] font-mono font-medium">
                        UTR: {order.paymentReceipt?.utrNumber || 'UTR-HDFC-99881144'} • Settled via Instant Escrow
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Bank Credit Receipt</span>
                  </button>
                </div>
              )}

              <OrderSupportActions tradeDealId={order.id} />

            </div>
          ))
        )}
      </div>

      {/* Vehicle Dispatch Modal */}
      {activeDispatchOrder && (
        <VehicleDispatchModal
          order={activeDispatchOrder}
          onClose={() => setDispatchingOrderId(null)}
        />
      )}

      {/* Payment Receipt Modal */}
      {selectedReceiptOrder && (
        <PaymentReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

    </div>
  );
};
