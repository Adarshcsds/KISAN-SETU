import React from 'react';
import { OrderRequest } from '../../types';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Printer, 
  Building2, 
  Receipt, 
  DollarSign,
  Landmark,
  FileCheck
} from 'lucide-react';

interface PaymentReceiptModalProps {
  order: OrderRequest;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ order, onClose }) => {
  const receipt = order.paymentReceipt || {
    utrNumber: `UTR-HDFC-${new Date().getFullYear()}99881144`,
    bankName: 'HDFC Bank - Rural Kisan Branch',
    accountNumberMasked: 'XXXX-XXXX-4812',
    grossAmount: order.grossAmount,
    freightDeducted: order.freightCost,
    handlingDeducted: order.handlingCost,
    netCreditedAmount: order.calculatedNetRealization,
    settledAtTimestamp: order.settledAt || '23 Aug 2026, 11:30 AM',
    paymentMode: 'Instant Escrow IMPS' as const,
    assayerGradeCertified: `${order.qualityGrade} Certified`,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-6 text-[#1F2937] space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#DCFCE7] border-2 border-[#86EFAC] flex items-center justify-center text-[#15803D] mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1F2937]">
            Official Payment Settlement Certificate
          </h2>
          <p className="text-xs text-[#15803D] font-bold font-mono">
            Direct Bank Escrow Credit Completed (Zero Middleman Cut)
          </p>
        </div>

        {/* Bank & UTR Capsule */}
        <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-[#E5E7EB] pb-2">
            <span className="text-[#6B7280] flex items-center font-medium">
              <Landmark className="w-4 h-4 mr-1.5 text-[#15803D]" /> Receiving Bank Account:
            </span>
            <span className="font-bold text-[#1F2937] font-mono">{receipt.bankName} ({receipt.accountNumberMasked})</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-[#E5E7EB] pb-2">
            <span className="text-[#6B7280] font-medium">Bank UTR Transaction ID:</span>
            <span className="font-bold text-[#15803D] font-mono">{receipt.utrNumber}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280] font-medium">Settlement Timestamp:</span>
            <span className="text-[#1F2937] font-mono font-semibold">{receipt.settledAtTimestamp}</span>
          </div>
        </div>

        {/* Financial Line Item Breakdown */}
        <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] space-y-2 text-xs">
          <div className="text-[#4B5563] font-bold uppercase tracking-wider text-[11px] mb-1">
            Settlement Audit Breakdown (Order {order.id})
          </div>

          <div className="flex justify-between py-1 text-[#4B5563]">
            <span>Gross Produce Value ({order.quantityQuintals} Qtl @ ₹{order.proposedPricePerQuintal}/q):</span>
            <span className="font-mono font-bold text-[#1F2937]">₹{receipt.grossAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-1 text-[#15803D] font-bold">
            <span>Middleman / Arhatiya Commission:</span>
            <span className="font-mono">₹0.00 (Zero Commission)</span>
          </div>

          <div className="flex justify-between py-1 text-[#DC2626]">
            <span>Verified Freight & Logistics:</span>
            <span className="font-mono font-bold">-₹{receipt.freightDeducted.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-1 text-[#B45309]">
            <span>APMC Cess & Weighbridge Handling:</span>
            <span className="font-mono font-bold">-₹{receipt.handlingDeducted.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] text-sm font-extrabold">
            <span className="text-[#15803D]">Total Net Amount Credited:</span>
            <span className="font-mono text-[#15803D] text-lg">
              ₹{receipt.netCreditedAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Assayer Certification Badge */}
        <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#86EFAC] text-xs text-[#4B5563] flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-[#15803D] flex-shrink-0" />
          <div>
            <div className="font-bold text-[#15803D]">{receipt.assayerGradeCertified}</div>
            <div className="text-[11px] text-[#6B7280]">Buyer: {order.buyerCompany} • Delivered & Verified at Plant Gate</div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#4B5563] text-xs font-bold flex items-center space-x-2 border border-[#D1D5DB] transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
