import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderRequest, User } from '../../types';
import { 
  Building2, 
  Package, 
  Truck, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  MapPin, 
  Phone, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  Navigation,
  Check,
  PlusCircle,
  ShoppingBag,
  Send,
  X
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { 
    orders, 
    acceptOrder, 
    counterOrder, 
    rejectOrder, 
    settlePayment, 
    placeDirectBuyerOrder,
    usersList,
    commodities,
    buyerEscrowLocked,
    t 
  } = useApp();

  const [counterModalOrder, setCounterModalOrder] = useState<OrderRequest | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState<number>(2420);
  const [counterNotes, setCounterNotes] = useState<string>('Standard milling price ceiling for this batch.');

  // Direct PO Modal State
  const [isDirectPoModalOpen, setIsDirectPoModalOpen] = useState<boolean>(false);
  const farmersList = usersList.filter(u => u.role === 'farmer');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmersList[0]?.id || 'usr-1');
  const [poCropId, setPoCropId] = useState<string>('wheat');
  const [poQuantity, setPoQuantity] = useState<number>(90);
  const [poPrice, setPoPrice] = useState<number>(2510);
  const [poNotes, setPoNotes] = useState<string>('Urgent batch requirement for flour milling plant. Direct farm gate pickup arranged.');

  // Pending incoming requests
  const pendingOrders = orders.filter(o => o.status === 'pending');
  // Active in-transit or accepted
  const activeProcurements = orders.filter(o => o.status === 'accepted' || o.status === 'dispatched');
  // In transit trucks
  const inTransitTrucks = orders.filter(o => o.status === 'dispatched' && o.dispatchDetails);

  const handleOpenCounter = (order: OrderRequest) => {
    setCounterModalOrder(order);
    setCounterPriceInput(order.proposedPricePerQuintal - 40);
  };

  const handleConfirmCounter = () => {
    if (counterModalOrder) {
      counterOrder(counterModalOrder.id, counterPriceInput, counterNotes);
      setCounterModalOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Buyer Header Banner */}
      <div className="clean-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
              AgroCorp Institutional Procurement Portal
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
              ISO 9001:2015
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-1 font-medium">
            Pune & Western Maharashtra Sourcing Desk • Direct Farm-Gate Procurement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDirectPoModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Issue Direct Purchase Order to Farmer</span>
          </button>

          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
            <ShieldCheck className="w-4 h-4 text-[#15803D] mr-1.5" />
            Bank Escrow Connected
          </span>
        </div>

      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[10px] text-[#6B7280] font-semibold">Total Season Procured</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F2937] stat-number mt-1">
            18,450 <span className="text-xs font-normal text-[#6B7280]">Qtl</span>
          </div>
          <div className="text-[10px] text-[#15803D] font-bold mt-0.5">
            +14.2% vs target quota
          </div>
        </div>

        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[10px] text-[#6B7280] font-semibold">Active Procurements</div>
          <div className="text-xl sm:text-2xl font-bold text-[#B45309] stat-number mt-1">
            {activeProcurements.length} <span className="text-xs font-normal text-[#6B7280]">batches</span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            {pendingOrders.length} pending review
          </div>
        </div>

        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[10px] text-[#6B7280] font-semibold">Escrow Funds Locked</div>
          <div className="text-xl sm:text-2xl font-bold text-[#15803D] stat-number mt-1">
            ₹{(buyerEscrowLocked / 10000000).toFixed(2)} <span className="text-xs font-normal text-[#6B7280]">Cr</span>
          </div>
          <div className="text-[10px] text-[#166534] font-semibold mt-0.5">
            Instant Farmer Bank Guarantee
          </div>
        </div>

        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[10px] text-[#6B7280] font-semibold">Inbound Fleet En Route</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1D4ED8] stat-number mt-1">
            {inTransitTrucks.length} <span className="text-xs font-normal text-[#6B7280]">vehicles</span>
          </div>
          <div className="text-[10px] text-[#1D4ED8] font-bold mt-0.5">
            Live GPS telemetry active
          </div>
        </div>

      </div>

      {/* Main Grid: Incoming Sell Requests Inbox (7 cols) | Live Inbound Fleet Tracking (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Incoming Farmer Sell Requests (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#E67E22]" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
                Incoming Sell Requests Inbox ({pendingOrders.length})
              </h2>
            </div>
            <span className="text-xs text-[#6B7280] font-medium">Real-time proposals</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="clean-card p-8 text-center text-[#6B7280] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#15803D]" />
              <p className="text-sm font-bold text-[#1F2937]">All incoming farmer proposals have been reviewed.</p>
              <p className="text-xs text-[#6B7280]">New requests will automatically pop up here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="clean-card p-5 space-y-4"
                >
                  {/* Farmer Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base text-[#1F2937]">{order.farmerName}</span>
                        <span className="text-[10px] font-mono font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                          {order.qualityGrade}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563]">
                        {order.farmerLocation} • {order.farmerPhone}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#6B7280]">Proposed Rate</div>
                      <div className="text-lg font-extrabold text-[#15803D] font-mono">
                        ₹{order.proposedPricePerQuintal}<span className="text-xs font-normal text-[#6B7280]">/q</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Quality Specs */}
                  <div className="grid grid-cols-3 gap-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] text-xs">
                    <div>
                      <div className="text-[10px] text-[#6B7280]">Offered Crop</div>
                      <div className="font-bold text-[#1F2937] mt-0.5">{order.cropName}</div>
                      <div className="text-[10px] text-[#6B7280]">{order.variety}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#6B7280]">Batch Volume</div>
                      <div className="font-bold text-[#15803D] font-mono mt-0.5">
                        {order.quantityQuintals} Quintals
                      </div>
                      <div className="text-[10px] text-[#6B7280] font-mono">~{(order.quantityQuintals * 0.1).toFixed(1)} MT</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#6B7280]">Assayed Moisture</div>
                      <div className="font-bold text-[#1F2937] font-mono mt-0.5">
                        {order.moisturePercent}%
                      </div>
                      <div className="text-[10px] text-[#6B7280] font-mono">Loss Est: {order.expectedLossPercent}%</div>
                    </div>
                  </div>

                  {order.farmerNotes && (
                    <div className="text-xs text-[#4B5563] bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB]">
                      <span className="text-[#1F2937] font-bold">Farmer Note: </span>
                      {order.farmerNotes}
                    </div>
                  )}

                  {/* Buyer Decision Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5E7EB]">
                    <div className="text-xs text-[#4B5563] font-mono">
                      Gross Total: <span className="font-bold text-[#1F2937]">₹{order.grossAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => rejectOrder(order.id, 'Price mismatch')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FEE2E2] hover:text-[#B91C1C] text-[#4B5563] text-xs font-bold border border-[#D1D5DB] transition cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => handleOpenCounter(order)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#DBEAFE] hover:text-[#1D4ED8] text-[#1F2937] text-xs font-bold border border-[#D1D5DB] transition cursor-pointer"
                      >
                        Counter Offer
                      </button>

                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="px-5 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Order</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Active Procurements & Settled Batches List */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider">
              Active Procurement Batches ({activeProcurements.length})
            </h3>

            <div className="space-y-2.5">
              {activeProcurements.map((proc) => (
                <div
                  key={proc.id}
                  className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#1F2937]">
                        {proc.id} • {proc.farmerName}
                      </div>
                      <div className="text-[#6B7280] text-[11px]">
                        {proc.quantityQuintals} Qtl {proc.cropName} • ₹{proc.proposedPricePerQuintal}/q
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      proc.status === 'dispatched' 
                        ? 'bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]' 
                        : 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]'
                    }`}>
                      {proc.status === 'dispatched' ? '🚚 In Transit' : '⏳ Awaiting Load'}
                    </span>

                    {proc.status === 'dispatched' && (
                      <button
                        onClick={() => settlePayment(proc.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold transition cursor-pointer shadow-sm"
                        title="Verify cargo at gate and release bank payout"
                      >
                        Verify & Release Escrow
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Live Inbound Fleet Tracking & Map (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-[#2E7D32]" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
                Live Inbound Fleet Tracking
              </h2>
            </div>
            <span className="text-xs text-[#15803D] font-bold font-mono">GPS ACTIVE</span>
          </div>

          <div className="clean-card p-4 space-y-4">
            
            {/* Visual Simulated Satellite Map */}
            <div className="h-48 sm:h-56 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] relative overflow-hidden flex flex-col justify-between p-3">
              
              {/* Map road grid simulation */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2E7D32_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Origin / Destination Markers */}
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
                <div className="bg-white px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-[#15803D] font-bold flex items-center space-x-1 shadow-sm">
                  <MapPin className="w-3 h-3" />
                  <span>Nashik Farm Gates</span>
                </div>
                <div className="bg-white px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-[#B45309] font-bold flex items-center space-x-1 shadow-sm">
                  <Building2 className="w-3 h-3" />
                  <span>AgroCorp Mill, Pune</span>
                </div>
              </div>

              {/* Truck moving on simulated route */}
              <div className="relative z-10 my-auto px-4">
                <div className="h-1 bg-[#D1D5DB] w-full rounded-full relative">
                  <div 
                    className="h-full bg-[#2E7D32] rounded-full" 
                    style={{ width: `${inTransitTrucks[0]?.dispatchDetails?.currentGpsProgressPercent || 45}%` }} 
                  />
                  <div 
                    className="absolute -top-3 p-1 rounded-full bg-[#2E7D32] text-white shadow-md transform -translate-x-1/2 transition-all duration-1000"
                    style={{ left: `${inTransitTrucks[0]?.dispatchDetails?.currentGpsProgressPercent || 45}%` }}
                  >
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-[#6B7280] font-mono mt-2 font-semibold">
                  <span>Farm Dispatch</span>
                  <span>Highway NH-60</span>
                  <span>Plant Gate</span>
                </div>
              </div>

              <div className="relative z-10 text-center text-[10px] text-[#6B7280] font-mono">
                Active Telemetry: High Frequency Satellite GPS
              </div>

            </div>

            {/* Inbound Vehicles List */}
            <div className="space-y-3">
              {inTransitTrucks.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-3">No loaded vehicles currently on route.</p>
              ) : (
                inTransitTrucks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F2937] font-mono">{t.dispatchDetails?.licensePlate}</span>
                      <span className="text-[#B45309] font-mono font-bold">
                        ETA: ~{t.dispatchDetails?.etaMinutes} mins
                      </span>
                    </div>

                    <div className="text-[#4B5563] flex items-center justify-between text-[11px]">
                      <span>Farmer: {t.farmerName}</span>
                      <span className="font-bold text-[#1F2937]">Load: {t.quantityQuintals} Qtl {t.cropName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                      <span>Driver: {t.dispatchDetails?.driverName}</span>
                      <span className="text-[#15803D] font-mono font-bold">Pass: {t.dispatchDetails?.gatePassId}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Counter Offer Modal */}
      {counterModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#1F2937]">
              Send Counter Offer to {counterModalOrder.farmerName}
            </h3>
            
            <div className="text-xs text-[#4B5563] space-y-1">
              <div>Requested Rate: <span className="font-bold text-[#1F2937] font-mono">₹{counterModalOrder.proposedPricePerQuintal}/q</span></div>
              <div>Batch Volume: <span className="font-bold text-[#15803D] font-mono">{counterModalOrder.quantityQuintals} Quintals</span></div>
            </div>

            <div>
              <label className="block text-xs text-[#1F2937] font-bold mb-1">
                Your Counter Rate (₹/Quintal)
              </label>
              <input
                type="number"
                value={counterPriceInput}
                onChange={(e) => setCounterPriceInput(Number(e.target.value))}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs font-bold text-[#15803D] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#1F2937] font-bold mb-1">
                Reason / Note for Farmer
              </label>
              <textarea
                rows={2}
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1F2937]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setCounterModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-white text-[#4B5563] hover:text-[#1F2937] text-xs font-bold border border-[#D1D5DB] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCounter}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition cursor-pointer"
              >
                Submit Counter Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Buyer Purchase Order (PO) Issuance Modal */}
      {isDirectPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-[#1F2937]">
            
            <button
              onClick={() => setIsDirectPoModalOpen(false)}
              className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-[#B45309]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">
                  Issue Direct Purchase Order to Farmer
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Targeted contract with escrow price guarantee & farm gate pickup
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              
              {/* Select Target Farmer */}
              <div>
                <label className="block text-[#1F2937] font-bold mb-1">
                  Select Farmer / Lot Owner
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2.5 text-[#1F2937] font-bold focus:border-[#2E7D32]"
                >
                  {farmersList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} • {f.location}, {f.district} ({f.farmSizeAcres || 5} Acres)
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1F2937] font-bold mb-1">
                    Commodity / Crop
                  </label>
                  <select
                    value={poCropId}
                    onChange={(e) => {
                      setPoCropId(e.target.value);
                      const found = commodities.find(c => c.id === e.target.value);
                      if (found) setPoPrice(found.currentAvgPrice + 40);
                    }}
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-[#1F2937] font-bold"
                  >
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#1F2937] font-bold mb-1">
                    Order Volume (Quintals)
                  </label>
                  <input
                    type="number"
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 font-mono font-extrabold text-[#15803D]"
                  />
                </div>
              </div>

              {/* Price & Escrow Lock Estimation */}
              <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                <div>
                  <label className="block text-[11px] text-[#6B7280] font-semibold mb-1">
                    Guaranteed Rate (₹/Qtl)
                  </label>
                  <input
                    type="number"
                    value={poPrice}
                    onChange={(e) => setPoPrice(Number(e.target.value))}
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 font-mono font-bold text-[#B45309] text-sm"
                  />
                </div>

                <div>
                  <div className="text-[11px] text-[#6B7280] font-semibold mb-1">Escrow Lock Total</div>
                  <div className="text-base font-extrabold text-[#15803D] font-mono mt-1">
                    ₹{(poQuantity * poPrice).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#1F2937] font-bold mb-1">
                  Procurement Instructions / Pickup Terms
                </label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-[#1F2937]"
                />
              </div>

            </div>

            {/* Modal Submit */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsDirectPoModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white text-[#4B5563] hover:text-[#1F2937] text-xs font-bold border border-[#D1D5DB] cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  const targetFarmer = farmersList.find(f => f.id === selectedFarmerId) || farmersList[0];
                  const cropObj = commodities.find(c => c.id === poCropId) || commodities[0];

                  placeDirectBuyerOrder({
                    farmerId: targetFarmer.id,
                    farmerName: targetFarmer.name,
                    farmerPhone: targetFarmer.phone,
                    farmerLocation: targetFarmer.location,
                    farmerDistrict: targetFarmer.district,
                    cropId: cropObj.id,
                    cropName: cropObj.name,
                    variety: cropObj.varieties[0] || 'Premium A-Grade',
                    quantityQuintals: poQuantity,
                    proposedPricePerQuintal: poPrice,
                    buyerId: 'buyer-agrocorp',
                    buyerName: 'Vikram Sethi',
                    buyerCompany: 'AgroCorp India Ltd.',
                    buyerNotes: poNotes,
                  });

                  setIsDirectPoModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Buy Order & Lock Escrow</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
