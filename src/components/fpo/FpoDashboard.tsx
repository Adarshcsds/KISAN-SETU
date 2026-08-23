import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface MemberLot {
  id: string;
  farmerName: string;
  village: string;
  crop: string;
  quantityQuintals: number;
  moisturePercent: number;
  status: 'pooled' | 'allocated';
}

export const FpoDashboard: React.FC = () => {
  const { mandis, t } = useApp();

  const [memberLots, setMemberLots] = useState<MemberLot[]>([
    { id: 'LOT-01', farmerName: 'Rajesh Kumar Patel', village: 'Niphad', crop: 'Wheat Lokwan', quantityQuintals: 75, moisturePercent: 11.2, status: 'pooled' },
    { id: 'LOT-02', farmerName: 'Suresh Patil', village: 'Dindori', crop: 'Wheat Lokwan', quantityQuintals: 50, moisturePercent: 11.5, status: 'pooled' },
    { id: 'LOT-03', farmerName: 'Ganpat Rao Deshmukh', village: 'Sinnar', crop: 'Wheat Lokwan', quantityQuintals: 85, moisturePercent: 11.0, status: 'pooled' },
    { id: 'LOT-04', farmerName: 'Meera Devi Sharma', village: 'Yeola', crop: 'Wheat Lokwan', quantityQuintals: 90, moisturePercent: 11.4, status: 'pooled' },
  ]);

  const totalPooledQuintals = memberLots.reduce((sum, l) => sum + l.quantityQuintals, 0);
  const institutionalBulkRate = 2520; // +₹70/q premium over individual rate
  const totalPooledGrossValue = totalPooledQuintals * institutionalBulkRate;
  const collectivePremiumGain = totalPooledQuintals * 70;

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="clean-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
              Sahyadri Farmers Producer Co. (FPO Aggregation Desk)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]">
              480 Active Members
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-1 font-medium">
            Aggregate smallholder volumes, unlock direct FMCG export contracts, and automate fair dividend splits
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center">
            <TrendingUp className="w-4 h-4 mr-1 text-[#15803D]" />
            +₹70/Qtl Bulk Bargaining Premium
          </span>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[11px] text-[#6B7280] font-semibold">Current Pooled Volume</div>
          <div className="text-2xl font-extrabold text-[#1F2937] font-mono mt-1">
            {totalPooledQuintals} <span className="text-xs font-normal text-[#6B7280]">Qtl ({ (totalPooledQuintals * 0.1).toFixed(1) } MT)</span>
          </div>
          <div className="text-[10px] text-[#15803D] font-bold mt-1">
            4 Member Farmer Lots Combined
          </div>
        </div>

        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[11px] text-[#6B7280] font-semibold">Negotiated Bulk Contract Rate</div>
          <div className="text-2xl font-extrabold text-[#15803D] font-mono mt-1">
            ₹{institutionalBulkRate.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#6B7280]">/q</span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-1 font-medium">
            ITC Sourcing Unit Contract
          </div>
        </div>

        <div className="clean-card clean-card-hover p-4.5">
          <div className="text-[11px] text-[#6B7280] font-semibold">Extra Realization for Members</div>
          <div className="text-2xl font-extrabold text-[#B45309] font-mono mt-1">
            +₹{collectivePremiumGain.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-[#B45309] mt-1 font-bold">
            Direct collective bargaining upside
          </div>
        </div>

      </div>

      {/* Member Lots Table */}
      <div className="clean-card p-5 space-y-4">
        
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>Pooled Smallholder Member Lots</span>
          </h2>
          <span className="text-xs text-[#6B7280] font-medium">Automated moisture-adjusted revenue distribution</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F9FAFB] text-[#4B5563] text-[11px] border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Lot ID</th>
                <th className="py-2.5 px-3 font-bold">Member Farmer</th>
                <th className="py-2.5 px-3 font-bold">Village</th>
                <th className="py-2.5 px-3 font-bold">Quantity (Qtl)</th>
                <th className="py-2.5 px-3 font-bold">Moisture</th>
                <th className="py-2.5 px-3 font-bold">Bulk Payout (₹)</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {memberLots.map((lot) => {
                const memberPayout = lot.quantityQuintals * institutionalBulkRate;
                return (
                  <tr key={lot.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#1F2937]">{lot.id}</td>
                    <td className="py-3 px-3 font-bold text-[#1F2937]">{lot.farmerName}</td>
                    <td className="py-3 px-3 text-[#4B5563]">{lot.village}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#15803D]">{lot.quantityQuintals} Qtl</td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#1F2937]">{lot.moisturePercent}%</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1F2937]">₹{memberPayout.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                        Ready for Bulk Dispatch
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lock Contract Action */}
        <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <div>
            <div className="text-xs font-bold text-[#1F2937]">Bulk Consignment Ready: {totalPooledQuintals} Quintals (30 MT Container)</div>
            <div className="text-[11px] text-[#6B7280]">Total Contract Value: ₹{totalPooledGrossValue.toLocaleString('en-IN')}</div>
          </div>

          <button className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition cursor-pointer">
            <Building2 className="w-4 h-4" />
            <span>Submit Bulk RFQ to ITC & Adani</span>
          </button>
        </div>

      </div>

    </div>
  );
};
