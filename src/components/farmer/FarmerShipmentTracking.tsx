import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Loader, AlertCircle } from 'lucide-react';
import { KisanSetuApi } from '../../services/api';

interface Shipment {
  id: string;
  buyerName?: string;
  buyerOrganizationName?: string;
  tradeDealId: string;
  dealCode: string;
  buyerId: string;
  cropName: string;
  quantityQuintals: number;
  pickupLocation: string;
  deliveryLocation: string;
  status: string;
  providerId: string;
  providerName: string;
  licensePlate: string;
  driverName?: string;
  driverPhone?: string;
  currentLocation: string;
  loadingDate?: string;
  loadingTime?: string;
  etaText: string;
  updatedAt: string;
}

interface Props {
  token: string;
}

export const FarmerShipmentTracking: React.FC<Props> = ({ token }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [payments, setPayments] = useState<Record<string, { amount: number; status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShipments();
    const interval = setInterval(loadShipments, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const [data, paymentData] = await Promise.all([KisanSetuApi.getFarmerShipments(token), KisanSetuApi.getPayments(token)]);
      setShipments(data);
      setPayments(Object.fromEntries((paymentData || []).map((payment: { tradeDealId: string; amount: number; status: string }) => [payment.tradeDealId, payment])));
      setError(null);
    } catch (err) {
      console.error('Failed to load shipments:', err);
      setError('Failed to load shipment information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'WAITING_BUYER_APPROVAL': 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
      'LOGISTICS_CONFIRMED': 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',
      'VEHICLE_ASSIGNED': 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',
      'DISPATCHED': 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
      'IN_TRANSIT': 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
      'DELIVERED': 'bg-[#E9D5FF] text-[#6B21A8] border-[#D8B4FE]',
      'COMPLETED': 'bg-[#D1D5DB] text-[#374151] border-[#9CA3AF]',
    };
    return statusMap[status] || 'bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]';
  };

  const getStatusText = (status: string) => {
    const textMap: { [key: string]: string } = {
      'WAITING_BUYER_APPROVAL': '⏳ Awaiting Buyer Approval',
      'LOGISTICS_CONFIRMED': '✓ Logistics Confirmed',
      'VEHICLE_ASSIGNED': '🚚 Vehicle Assigned',
      'DISPATCHED': '📦 Dispatched',
      'IN_TRANSIT': '🚚 In Transit',
      'DELIVERED': '✓ Delivered',
      'COMPLETED': '✓ Completed',
    };
    return textMap[status] || status;
  };

  if (loading) {
    return (
      <div className="clean-card p-8 text-center">
        <Loader className="w-6 h-6 mx-auto text-[#1D4ED8] animate-spin" />
        <p className="text-sm text-[#6B7280] mt-2">Loading your shipments...</p>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="clean-card p-6 text-center text-[#6B7280]">
        <Truck className="w-8 h-8 mx-auto text-[#6B7280] opacity-50 mb-2" />
        <p className="text-sm font-medium text-[#1F2937]">No shipments yet</p>
        <p className="text-xs text-[#6B7280] mt-1">Transportation details will appear here once the buyer confirms a logistics provider.</p>
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(shipment.status)}`}>
                    {getStatusText(shipment.status)}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">Crop: {shipment.cropName} • Qty: {shipment.quantityQuintals} Qtl</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Buyer</div>
              <div className="text-sm font-bold text-[#1F2937]">
                {shipment.buyerName || 'Buyer'}
                {shipment.buyerOrganizationName && <div className="text-xs text-[#6B7280] mt-1">{shipment.buyerOrganizationName}</div>}
              </div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Transporter</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.providerName || 'Not assigned'}</div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Pickup</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.pickupLocation}</div>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="text-[10px] text-[#6B7280] font-semibold mb-1">Destination</div>
              <div className="text-sm font-bold text-[#1F2937]">{shipment.deliveryLocation}</div>
            </div>
          </div>

          {/* Vehicle & Tracking Info (if available) */}
          {payments[shipment.tradeDealId] && (
            <div className="bg-[#F0FDF4] border border-[#BBFDBF] rounded-lg p-3">
              <div className="text-[10px] text-[#166534] font-semibold">KisanSetu Escrow</div>
              <div className="text-sm font-bold text-[#15803D]">₹{payments[shipment.tradeDealId].amount.toLocaleString('en-IN')} · {payments[shipment.tradeDealId].status === 'RELEASED' ? 'Payment Released' : 'Buyer Payment Secured'}</div>
            </div>
          )}

          {/* Vehicle & Tracking Info (if available) */}
          {(shipment.licensePlate || shipment.currentLocation) && (
            <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
              {shipment.licensePlate && (
                <div className="flex items-center justify-between bg-[#F0FDF4] p-3 rounded-lg border border-[#BBFDBF]">
                  <div>
                    <div className="text-[10px] text-[#4B5563] font-semibold">Vehicle Number</div>
                    <div className="text-sm font-bold text-[#15803D] font-mono">{shipment.licensePlate}</div>
                  </div>
                </div>
              )}

              {shipment.currentLocation && (
                <div className="flex items-center space-x-3 bg-[#F3F4F6] p-3 rounded-lg border border-[#D1D5DB]">
                  <MapPin className="w-4 h-4 text-[#1F2937] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-[#4B5563] font-semibold">Current Location</div>
                    <div className="text-sm font-bold text-[#1F2937]">{shipment.currentLocation}</div>
                  </div>
                </div>
              )}

              {(shipment.loadingDate || shipment.loadingTime) && (
                <div className="flex items-center space-x-3 bg-[#F3F4F6] p-3 rounded-lg border border-[#D1D5DB]">
                  <Clock className="w-4 h-4 text-[#1F2937] flex-shrink-0" />
                  <div><div className="text-[10px] text-[#4B5563] font-semibold">Loading schedule</div><div className="text-sm font-bold text-[#1F2937]">{shipment.loadingDate || 'Date pending'} {shipment.loadingTime || ''}</div></div>
                </div>
              )}

              {shipment.driverName && <div className="text-sm text-[#1F2937]"><span className="font-semibold">Driver:</span> {shipment.driverName}{shipment.driverPhone ? ` · ${shipment.driverPhone}` : ''}</div>}

              {shipment.etaText && (
                <div className="flex items-center space-x-3 bg-[#FEF3C7] p-3 rounded-lg border border-[#FCD34D]">
                  <Clock className="w-4 h-4 text-[#92400E] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-[#92400E] font-semibold">ETA</div>
                    <div className="text-sm font-bold text-[#B45309]">{shipment.etaText}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-[#6B7280] text-right">
            Last updated: {new Date(shipment.updatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};
