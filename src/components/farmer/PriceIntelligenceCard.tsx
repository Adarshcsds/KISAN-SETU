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
  Info,
  CheckCircle2
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
  const [timeHorizon, setTimeHorizon] = useState<'7d' | '15d' | '30d'>('15d');

  const fullForecastData = HISTORICAL_FORECAST_DATA[selectedCropId] || HISTORICAL_FORECAST_DATA['wheat'] || [];
  
  // Filter or slice based on timeHorizon
  const forecastData = timeHorizon === '7d' 
    ? fullForecastData.slice(0, 8)
    : timeHorizon === '15d'
      ? fullForecastData.slice(0, 10)
      : fullForecastData;

  // AI Sell vs Store carrying cost calculation
  const currentPrice = selectedCrop.currentAvgPrice;
  const thirtyDayForecast = fullForecastData[fullForecastData.length - 1]?.forecastPrice || currentPrice * 1.1;
  const monthlyStorageCostPerQtl = selectedCrop.category === 'Vegetable' ? 45 : 18;
  const netGainAfterStorage = thirtyDayForecast - currentPrice - monthlyStorageCostPerQtl;
  const shouldStore = netGainAfterStorage > 50 && selectedCrop.shelfLifeDays > 60;

  return (
    <div className="space-y-5">
      
      {/* Top Header & Range Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight">
              {t('price_trends')}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-mono">
              AI FORECAST
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-0.5">
            Machine-learning price trend projection and daily arrival volume monitoring
          </p>
        </div>

        {/* Time horizon pill switch */}
        <div className="flex items-center space-x-1.5 bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB]">
          {(['7d', '15d', '30d'] as const).map(horizon => (
            <button
              key={horizon}
              onClick={() => setTimeHorizon(horizon)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeHorizon === horizon
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              {horizon === '7d' ? '7 Days' : horizon === '15d' ? '15 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Snapshot Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-bold">{t('today_mandi_price')}</div>
          <div className="text-lg sm:text-xl font-extrabold text-[#1F2937] mt-1 font-mono">
            ₹{selectedCrop.currentAvgPrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#6B7280]">/q</span>
          </div>
          <div className="text-[10px] text-[#15803D] font-bold mt-0.5">
            {selectedCrop.change24h >= 0 ? `+${selectedCrop.change24h}% today` : `${selectedCrop.change24h}% today`}
          </div>
        </div>

        <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-bold">Govt. MSP Benchmark</div>
          <div className="text-lg sm:text-xl font-extrabold text-[#B45309] mt-1 font-mono">
            {selectedCrop.msp > 0 ? `₹${selectedCrop.msp.toLocaleString('en-IN')}` : 'Market Driven'}
            {selectedCrop.msp > 0 && <span className="text-xs font-normal text-[#6B7280]">/q</span>}
          </div>
          <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
            Govt. Minimum Support
          </div>
        </div>

        <div className="bg-[#F0FDF4] p-3.5 rounded-2xl border border-[#BBF7D0]">
          <div className="text-[10px] text-[#15803D] font-bold">{t('expected_price')}</div>
          <div className="text-lg sm:text-xl font-extrabold text-[#15803D] mt-1 font-mono">
            ₹{Math.round(thirtyDayForecast).toLocaleString('en-IN')}<span className="text-xs font-normal text-[#6B7280]">/q</span>
          </div>
          <div className="text-[10px] text-[#15803D] font-bold mt-0.5">
            +₹{Math.round(thirtyDayForecast - currentPrice)} expected gain
          </div>
        </div>

        <div className="bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
          <div className="text-[10px] text-[#6B7280] font-bold">Standard Moisture & Life</div>
          <div className="text-lg sm:text-xl font-extrabold text-[#1F2937] mt-1 font-mono">
            {selectedCrop.moistureStandardPercent}% <span className="text-xs font-normal text-[#6B7280]">max</span>
          </div>
          <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
            Shelf Life: ~{selectedCrop.shelfLifeDays} days
          </div>
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="date" stroke="#374151" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#374151" domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
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
            <Bar yAxisId="right" dataKey="arrivalVolume" name="Arrival Volume (Qtl)" fill="#D1D5DB" opacity={0.4} radius={[4, 4, 0, 0]} />
            <Area yAxisId="left" type="monotone" dataKey="upperConfidence" name="Confidence Band" fill="url(#colorForecast)" stroke="transparent" />
            <Line yAxisId="left" type="monotone" dataKey="actualPrice" name="Historical Mandi Price" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} />
            <Line yAxisId="left" type="monotone" dataKey="forecastPrice" name="AI Price Forecast" stroke="#2E7D32" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4, fill: '#2E7D32' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* AI Decision Support Box: Sell vs. Store Advisory */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        shouldStore 
          ? 'bg-[#F0FDF4] border-[#86EFAC]' 
          : 'bg-[#FEF3C7] border-[#FCD34D]'
      }`}>
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-2xl mt-0.5 text-xl flex-shrink-0 ${
            shouldStore ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FDE68A] text-[#B45309]'
          }`}>
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className={`text-xs sm:text-sm font-extrabold ${shouldStore ? 'text-[#15803D]' : 'text-[#92400E]'}`}>
                {shouldStore ? '💡 AI SALAH: STORE IN WAREHOUSE & SELL LATER' : '💡 AI SALAH: SELL SPOT TODAY AT MANDI'}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-mono text-[#15803D] font-bold border border-[#86EFAC]">
                Confidence 91%
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-1 leading-relaxed font-medium">
              {shouldStore ? (
                <>
                  Price surge of <strong>+₹{Math.round(thirtyDayForecast - currentPrice)}/Qtl</strong> exceeds warehouse storage costs (₹{monthlyStorageCostPerQtl}/Qtl/mo). Estimated net benefit: <strong className="text-[#15803D]">+₹{Math.round(netGainAfterStorage)}/Qtl extra profit</strong>.
                </>
              ) : (
                <>
                  High arrivals and short shelf-life (~{selectedCrop.shelfLifeDays} days). Selling spot now at nearest APMC locks in maximum profit with minimal post-harvest risk.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center space-x-2">
          <div className="text-right">
            <div className="text-[10px] text-[#6B7280] font-semibold">Net Estimated Return</div>
            <div className="text-sm sm:text-base font-extrabold text-[#15803D] font-mono">
              {shouldStore ? `+₹${Math.round(netGainAfterStorage * 75).toLocaleString('en-IN')}` : 'Immediate Cash Payout'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

