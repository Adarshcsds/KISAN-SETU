import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Package, AlertCircle, Loader, Check } from 'lucide-react';
import { KisanSetuApi } from '../../services/api';

interface AvailableDeal {
  tradeDealId: string;
  dealCode: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  cropName: string;
  quantityQuintals: number;
  pickupLocation: string;
  deliveryLocation: string;
  qualityGrade: string;
  status: string;
}

interface AssignedShipment {
  id: string;
  tradeDealId: string;
  dealCode: string;
  cropName: string;
  quantityQuintals: number;
  pickupLocation: string;
  deliveryLocation: string;
  status: string;
  providerName: string;
  licensePlate?: string;
  currentLocation?: string;
}

interface Props {
  token: string;
}

export const LogisticsDashboard: React.FC<Props> = ({ token }) => {
  const [availableDeals, setAvailableDeals] = useState<AvailableDeal[]>([]);
  const [assignedShipments, setAssignedShipments] = useState<AssignedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deals, shipments] = await Promise.all([
        KisanSetuApi.getLogisticsAvailableDeals(token),
        KisanSetuApi.getLogisticsShipments(token)
      ]);
      setAvailableDeals(deals || []);
      setAssignedShipments(shipments || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load logistics data:', err);
      setError('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDeal = async (dealId: string) => {
    try {
      setAccepting(dealId);
      await KisanSetuApi.acceptLogisticsShipment(token, dealId);
      await loadData();
    } catch (err) {
      console.error('Failed to accept deal:', err);
      setError('Failed to accept deal');
    } finally {
      setAccepting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; border: string } } = {
      'AVAILABLE': { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#86EFAC]' },
      'WAITING_BUYER_APPROVAL': { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#FCD34D]' },
      'LOGISTICS_CONFIRMED': { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', border: 'border-[#93C5FD]' },
      'VEHICLE_ASSIGNED': { bg: 'bg-[#D1D5DB]', text: 'text-[#374151]', border: 'border-[#9CA3AF]' },
      'DISPATCHED': { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', border: 'border-[#FECACA]' },
      'IN_TRANSIT': { bg: 'bg-[#E9D5FF]', text: 'text-[#6B21A8]', border: 'border-[#D8B4FE]' },
      'DELIVERED': { bg: 'bg-[#D1D5DB]', text: 'text-[#374151]', border: 'border-[#9CA3AF]' },
    };
    const badge = badges[status] || badges['AVAILABLE'];
    return badge;
  };

  if (loading) {
    return (
      <div className="clean-card p-8 text-center">
        <Loader className="w-6 h-6 mx-auto text-[#1D4ED8] animate-spin" />
        <p className="text-sm text-[#6B7280] mt-2">Loading logistics dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="clean-card p-4 bg-[#FEE2E2] border border-[#FECACA]">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#991B1B]">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#E5E7EB]">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-3 font-bold text-sm transition border-b-2 ${
            activeTab === 'available'
              ? 'text-[#1D4ED8] border-[#1D4ED8]'
              : 'text-[#6B7280] border-transparent hover:text-[#1F2937]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Available Deals ({availableDeals.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-3 font-bold text-sm transition border-b-2 ${
            activeTab === 'assigned'
              ? 'text-[#1D4ED8] border-[#1D4ED8]'
              : 'text-[#6B7280] border-transparent hover:text-[#1F2937]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>My Shipments ({assignedShipments.length})</span>
          </div>
        </button>
      </div>

      {/* Available Deals Tab */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableDeals.length === 0 ? (
            <div className="clean-card p-8 text-center">
              <Package className="w-8 h-8 mx-auto text-[#D1D5DB] opacity-50 mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">No available deals</p>
              <p className="text-xs text-[#6B7280] mt-1">Check back soon for new shipment opportunities</p>
            </div>
          ) : (
            availableDeals.map((deal) => (
              <div key={deal.tradeDealId} className="clean-card p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-bold text-[#1F2937]">{deal.dealCode}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(deal.status).bg} ${getStatusBadge(deal.status).text} ${getStatusBadge(deal.status).border}`}>
                        ✓ Available
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      {deal.cropName} • {deal.quantityQuintals} Qtl • Grade: {deal.qualityGrade}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#F9FAFB] rounded-lg p-3">
                    <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Farmer</div>
                    <div className="text-sm font-bold text-[#1F2937]">{deal.farmerName}</div>
                  </div>
                  <div className="bg-[#F9FAFB] rounded-lg p-3">
                    <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Buyer</div>
                    <div className="text-sm font-bold text-[#1F2937]">{deal.buyerName}</div>
                  </div>
                  <div className="bg-[#F9FAFB] rounded-lg p-3 sm:col-span-2">
                    <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Route</div>
                    <div className="flex items-center space-x-2 text-sm text-[#1F2937]">
                      <span className="font-bold">{deal.pickupLocation}</span>
                      <MapPin className="w-4 h-4 text-[#6B7280]" />
                      <span className="font-bold">{deal.deliveryLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Accept Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleAcceptDeal(deal.tradeDealId)}
                    disabled={accepting === deal.tradeDealId}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {accepting === deal.tradeDealId ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Accept Deal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assigned Shipments Tab */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedShipments.length === 0 ? (
            <div className="clean-card p-8 text-center">
              <Truck className="w-8 h-8 mx-auto text-[#D1D5DB] opacity-50 mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">No assigned shipments</p>
              <p className="text-xs text-[#6B7280] mt-1">Accept deals from the Available Deals tab to get started</p>
            </div>
          ) : (
            assignedShipments.map((shipment) => (
              <div key={shipment.id} className="clean-card p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-bold text-[#1F2937]">{shipment.dealCode}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(shipment.status).bg} ${getStatusBadge(shipment.status).text} ${getStatusBadge(shipment.status).border}`}>
                        {shipment.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      {shipment.cropName} • {shipment.quantityQuintals} Qtl
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#F9FAFB] rounded-lg p-3 sm:col-span-2">
                    <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Route</div>
                    <div className="flex items-center space-x-2 text-sm text-[#1F2937]">
                      <span className="font-bold">{shipment.pickupLocation}</span>
                      <MapPin className="w-4 h-4 text-[#6B7280]" />
                      <span className="font-bold">{shipment.deliveryLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle info if available */}
                {(shipment.licensePlate || shipment.currentLocation) && (
                  <div className="border-t border-[#E5E7EB] pt-3 space-y-2">
                    {shipment.licensePlate && (
                      <div className="text-xs">
                        <span className="text-[#6B7280]">Vehicle: </span>
                        <span className="font-bold text-[#1F2937] font-mono">{shipment.licensePlate}</span>
                      </div>
                    )}
                    {shipment.currentLocation && (
                      <div className="text-xs">
                        <span className="text-[#6B7280]">Current Location: </span>
                        <span className="font-bold text-[#1F2937]">{shipment.currentLocation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
