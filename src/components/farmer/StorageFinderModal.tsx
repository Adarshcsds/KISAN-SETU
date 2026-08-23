import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Warehouse, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Star,
  Thermometer,
  ExternalLink
} from 'lucide-react';

interface StorageFinderModalProps {
  onClose: () => void;
}

export const StorageFinderModal: React.FC<StorageFinderModalProps> = ({ onClose }) => {
  const { storages } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#1F2937]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D]">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
              Nearby WDRA Warehouses & Cold Storages
            </h2>
            <p className="text-xs text-[#6B7280]">
              Negotiable e-NWR warehouse receipts & cold storage for shelf-life extension
            </p>
          </div>
        </div>

        {/* Storage List */}
        <div className="space-y-3.5">
          {storages.map((facility) => (
            <div
              key={facility.id}
              className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#86EFAC] transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-[#1F2937]">{facility.name}</h4>
                    {facility.wdraCertified && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                        WDRA Certified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] flex items-center mt-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#9CA3AF]" />
                    {facility.location} ({facility.distanceKm} km away)
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#6B7280]">Storage Rate</div>
                  <div className="text-base font-extrabold text-[#15803D] font-mono">
                    ₹{facility.ratePerQuintalPerMonth}<span className="text-xs font-normal text-[#6B7280]">/q/month</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-[#E5E7EB] text-xs">
                <div>
                  <div className="text-[10px] text-[#6B7280]">Available Space</div>
                  <div className="font-bold text-[#1F2937] font-mono">{facility.availableQuintals.toLocaleString('en-IN')} Qtl</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280]">Facility Type</div>
                  <div className="font-bold text-[#15803D]">{facility.type}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280]">Rating</div>
                  <div className="font-bold text-[#B45309] flex items-center">
                    <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B] mr-1" />
                    {facility.rating}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[#4B5563] flex items-center font-medium">
                  <Phone className="w-3.5 h-3.5 mr-1 text-[#9CA3AF]" /> {facility.phone}
                </span>

                <button
                  onClick={() => alert(`Booking enquiry sent to ${facility.name}. They will call you at +91 98224 55192.`)}
                  className="px-4 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  Book Space
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
