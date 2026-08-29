import React, { useState, useEffect } from 'react';
import { Truck, AlertCircle, Check, X, Loader } from 'lucide-react';
import { KisanSetuApi } from '../../services/api';

interface ShipmentApproval {
  id: string;
  tradeDealId: string;
  dealCode: string;
  farmerId: string;
  buyerId: string;
  cropName: string;
  quantityQuintals: number;
  pickupLocation: string;
  deliveryLocation: string;
  status: string;
  providerId: string;
  providerName: string;
  createdAt: string;
}

interface Props {
  token: string;
}

export const TransportApprovalSection: React.FC<Props> = ({ token }) => {
  const [shipments, setShipments] = useState<ShipmentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const data = await KisanSetuApi.getBuyerShipments(token);
      // Filter to only those waiting for buyer approval
      const pendingApproval = data.filter((s: ShipmentApproval) => s.status === 'WAITING_BUYER_APPROVAL');
      setShipments(pendingApproval);
      setError(null);
    } catch (err) {
      console.error('Failed to load shipments:', err);
      setError('Failed to load transport approval requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dealId: string) => {
    try {
      setApproving(dealId);
      await KisanSetuApi.approveLogisticsProvider(token, dealId);
      await loadShipments();
    } catch (err) {
      console.error('Failed to approve logistics provider:', err);
      setError('Failed to approve logistics provider');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (dealId: string) => {
    try {
      setRejecting(dealId);
      await KisanSetuApi.rejectLogisticsProvider(token, dealId);
      await loadShipments();
    } catch (err) {
      console.error('Failed to reject logistics provider:', err);
      setError('Failed to reject logistics provider');
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="clean-card p-8 text-center">
        <Loader className="w-6 h-6 mx-auto text-[#1D4ED8] animate-spin" />
        <p className="text-sm text-[#6B7280] mt-2">Loading transport requests...</p>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="clean-card p-6 text-center text-[#6B7280]">
        <Truck className="w-8 h-8 mx-auto text-[#2E7D32] opacity-50 mb-2" />
        <p className="text-sm font-medium text-[#1F2937]">No transport approval requests</p>
        <p className="text-xs text-[#6B7280] mt-1">Logistics providers will appear here when shipments are ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="clean-card p-4 bg-[#FEE2E2] border border-[#FECACA]">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#991B1B]">{error}</p>
          </div>
        </div>
      )}

      {shipments.map((shipment) => (
        <div key={shipment.id} className="clean-card p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2.5 rounded-lg bg-[#DBEAFE] text-[#1D4ED8]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-[#1F2937]">Deal: {shipment.dealCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]">
                    🚚 Awaiting Your Approval
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">Crop: {shipment.cropName} • Qty: {shipment.quantityQuintals} Qtl</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Farmer</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.farmerId}</div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Transporter</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.providerName || 'Pending'}</div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Pickup Location</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.pickupLocation}</div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Delivery Location</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.deliveryLocation}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleApprove(shipment.tradeDealId)}
              disabled={approving === shipment.tradeDealId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {approving === shipment.tradeDealId ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Accept Transport</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleReject(shipment.tradeDealId)}
              disabled={rejecting === shipment.tradeDealId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {rejecting === shipment.tradeDealId ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
