import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HISTORICAL_FORECAST_DATA } from '../../data/mockData';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  Warehouse, 
  ShieldCheck, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const PriceIntelligenceCard: React.FC = () => {
  const { commodities, selectedCropId, setSelectedCropId, selectedCrop, t } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '15d' | '30d'>('15d');

  const forecastData = HISTORICAL_FORECAST_DATA[selectedCropId] || HISTORICAL_FORECAST_DATA['wheat'];

  // AI Sell vs Store carrying cost calculation
  const currentPrice = selectedCrop.currentAvgPrice;
  const thirtyDayForecast = forecastData[forecastData.length - 1]?.forecastPrice || currentPrice * 1.1;
  const monthlyStorageCostPerQtl = selectedCrop.category === 'Vegetable' ? 45 : 18;
  const netGainAfterStorage = thirtyDayForecast - currentPrice - monthlyStorageCostPerQtl;
  const shouldStore = netGainAfterStorage > 50 && selectedCrop.shelfLifeDays > 60;

  return (
    <div className="clean-card p-5 sm:p-6 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
              Price Trends & 30-Day AI Forecast
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-mono">
              PREDICTIVE AI
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-0.5">
            Machine-learning price projection and arrival volume monitoring
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#4B5563] font-medium">Viewing:</span>
          <span className="font-bold text-[#15803D] bg-[#DCFCE7] px-3 py-1 rounded-lg border border-[#86EFAC]">
            {selectedCrop.name}
          </span>
        </div>
      </div>

      {/* Snapshot Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-semibold">Current Mandi Rate</div>
          <div className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1">
            ₹{selectedCrop.currentAvgPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#6B7280]">/q</span>
          </div>
          <div className="text-[10px] text-[#15803D] font-bold mt-0.5">
            {selectedCrop.change24h >= 0 ? `+${selectedCrop.change24h}% today` : `${selectedCrop.change24h}% today`}
          </div>
        </div>

        <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-semibold">MSP Benchmark</div>
          <div className="text-lg sm:text-xl font-bold text-[#B45309] mt-1">
            {selectedCrop.msp > 0 ? `₹${selectedCrop.msp.toLocaleString('en-IN')}` : 'Market Driven'}
            {selectedCrop.msp > 0 && <span className="text-xs font-normal text-[#6B7280]">/q</span>}
          </div>
          <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
            Govt. Minimum Support
          </div>
        </div>

        <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-semibold">30-Day AI Forecast</div>
          <div className="text-lg sm:text-xl font-bold text-[#15803D] mt-1">
            ₹{Math.round(thirtyDayForecast).toLocaleString('en-IN')}<span className="text-xs font-normal text-[#6B7280]">/q</span>
          </div>
          <div className="text-[10px] text-[#15803D] font-bold mt-0.5">
            +₹{Math.round(thirtyDayForecast - currentPrice)} expected gain
          </div>
        </div>

        <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-semibold">Standard Moisture</div>
          <div className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1">
            {selectedCrop.moistureStandardPercent}% <span className="text-xs font-normal text-[#6B7280]">max</span>
          </div>
          <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
            Shelf Life: ~{selectedCrop.shelfLifeDays} days
          </div>
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="h-60 sm:h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#6B7280" domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
            <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                borderRadius: '12px',
                color: '#1F2937',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
              formatter={(value: any, name?: any) => {
                if (name === 'Arrival Volume') return [`${value} Qtl`, String(name)];
                return [`₹${value}/Qtl`, String(name)];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar yAxisId="right" dataKey="arrivalVolume" name="Arrival Volume (Qtl)" fill="#D1D5DB" opacity={0.5} radius={[4, 4, 0, 0]} />
            <Area yAxisId="left" type="monotone" dataKey="upperConfidence" name="Confidence Band" fill="url(#colorForecast)" stroke="transparent" />
            <Line yAxisId="left" type="monotone" dataKey="actualPrice" name="Historical Mandi Price" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} />
            <Line yAxisId="left" type="monotone" dataKey="forecastPrice" name="AI Price Forecast" stroke="#2E7D32" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4, fill: '#2E7D32' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* AI Decision Support Box: Sell vs. Store Advisory */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        shouldStore 
          ? 'bg-[#F0FDF4] border-[#86EFAC]' 
          : 'bg-[#FEF3C7] border-[#FCD34D]'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-xl mt-0.5 ${shouldStore ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FDE68A] text-[#B45309]'}`}>
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className={`text-xs sm:text-sm font-bold ${shouldStore ? 'text-[#15803D]' : 'text-[#92400E]'}`}>
                {shouldStore ? 'AI ADVISORY: STORE IN WAREHOUSE & SELL IN 3 WEEKS' : 'AI ADVISORY: SELL SPOT TODAY'}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-mono text-[#15803D] font-bold border border-[#86EFAC]">
                Confidence 89%
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-1">
              {shouldStore ? (
                <>
                  Price surge of <strong>+₹{Math.round(thirtyDayForecast - currentPrice)}/Qtl</strong> exceeds warehouse storage costs (₹{monthlyStorageCostPerQtl}/Qtl/mo). Estimated net gain: <strong className="text-[#15803D]">+₹{Math.round(netGainAfterStorage)}/Qtl</strong>.
                </>
              ) : (
                <>
                  High mandi arrivals and short shelf-life (~{selectedCrop.shelfLifeDays} days). Selling spot now at nearest APMC locks in maximum profit with minimal post-harvest risk.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center space-x-2">
          <div className="text-right hidden md:block">
            <div className="text-[10px] text-[#6B7280] font-medium">Net Estimated Benefit</div>
            <div className="text-sm font-extrabold text-[#15803D]">
              {shouldStore ? `+₹${Math.round(netGainAfterStorage * 75).toLocaleString('en-IN')}` : 'Immediate Cash'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
