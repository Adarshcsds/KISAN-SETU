import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { LogisticsDashboard } from './components/buyer/LogisticsDashboard';
import { MarketBuyersView } from './components/farmer/MarketBuyersView';
import { FarmerOrdersList } from './components/farmer/FarmerOrdersList';
import { DemandMarketplace } from './components/farmer/DemandMarketplace';
import { BuyerDashboard } from './components/buyer/BuyerDashboard';
import { FpoDashboard } from './components/fpo/FpoDashboard';
import { AiQualityAssessorModal } from './components/quality/AiQualityAssessorModal';
import { StorageFinderModal } from './components/farmer/StorageFinderModal';
import { AuthModal } from './components/auth/AuthModal';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Users, 
  Warehouse, 
  Scan, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Truck,
  Home
} from 'lucide-react';

export const App: React.FC = () => {
  const { 
    role, 
    activeTab, 
    setActiveTab, 
    viewingMandiBuyers, 
    setViewingMandiBuyers, 
    orders, 
    t 
  } = useApp();

  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  // Kept only to type-check the retired inline logistics markup below; the live view is LogisticsDashboard.
  const logisticsJobs: any[] = [];
  const logisticsLoading = false;
  const handleAcceptJob = async (_dealId: string) => undefined;

  const pendingFarmerOrdersCount = orders.filter(o => o.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2937] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Sub Navigation Tabs for Farmer / Buyer */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-16 sm:top-18 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
            
            <div className="flex items-center space-x-2">
              
              {role === 'farmer' && (
                <>
                  <button
                    onClick={() => { setViewingMandiBuyers(null); setActiveTab('dashboard'); }}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer touch-target ${
                      activeTab === 'dashboard' && !viewingMandiBuyers
                        ? 'bg-[#2E7D32] text-white shadow-sm'
                        : 'text-[#4B5563] hover:text-[#1F2937] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('home_nav')} (डैशबोर्ड)</span>
                  </button>

                  <button
                    onClick={() => { setViewingMandiBuyers(null); setActiveTab('orders'); }}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition relative cursor-pointer touch-target ${
                      activeTab === 'orders'
                        ? 'bg-[#2E7D32] text-white shadow-sm'
                        : 'text-[#4B5563] hover:text-[#1F2937] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>{t('my_orders_nav')} (सौदे)</span>
                    {pendingFarmerOrdersCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => { setViewingMandiBuyers(null); setActiveTab('demands'); }}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer touch-target ${
                      activeTab === 'demands' 
                        ? 'bg-[#2E7D32] text-white shadow-sm' 
                        : 'text-[#4B5563] hover:text-[#1F2937] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>{t('demands_nav')} (मांग)</span>
                  </button>

                  <button
                    data-storage-btn="true"
                    onClick={() => setIsStorageModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition cursor-pointer touch-target"
                  >
                    <Warehouse className="w-4 h-4 text-[#2563EB]" />
                    <span>{t('warehouse_cold_storage')}</span>
                  </button>

                  <button
                    onClick={() => setIsQualityModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#15803D] bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] transition cursor-pointer touch-target"
                  >
                    <Scan className="w-4 h-4 text-[#15803D]" />
                    <span>{t('ai_quality_assayer')}</span>
                  </button>
                </>
              )}

              {role === 'buyer' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] text-white shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('buyer_role')} Dashboard</span>
                  </button>
                </>
              )}

              {role === 'logistics' && (
                <button onClick={() => setActiveTab('dashboard')} className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#E67E22] text-white shadow-sm">
                  <Truck className="w-4 h-4" />
                  <span>Logistics Fleet</span>
                </button>
              )}

              {role === 'fpo' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>{t('fpo_pooling')}</span>
                  </button>
                </>
              )}

              {role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('admin_role')}</span>
                  </button>
                </>
              )}

            </div>

            {/* Help Pill */}
            <div className="hidden sm:flex items-center space-x-2 text-xs text-[#4B5563]">
              <span className="text-[11px] font-mono bg-[#F3F4F6] px-2.5 py-1 rounded-lg border border-[#E5E7EB] font-bold text-[#15803D]">
                ● Live APMC Connected
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-8">
        
        {/* If viewing a specific Mandi's buyers */}
        {viewingMandiBuyers ? (
          <MarketBuyersView
            mandi={viewingMandiBuyers}
            onBack={() => setViewingMandiBuyers(null)}
          />
        ) : (
          <>
            {/* Farmer View */}
            {role === 'farmer' && (
              <>
                {activeTab === 'dashboard' && (
                  <FarmerDashboard onOpenQualityAssessor={() => setIsQualityModalOpen(true)} />
                )}
                {activeTab === 'orders' && (
                  <FarmerOrdersList />
                )}
                {activeTab === 'demands' && <DemandMarketplace />}
              </>
            )}

            {/* Buyer View */}
            {role === 'buyer' && (
              <BuyerDashboard />
            )}

            {role === 'logistics' && <LogisticsDashboard token={localStorage.getItem('kisansetu_access_token') || ''} />}
            {false && role === 'logistics' && (
              <div className="space-y-6">
                <div className="clean-card rounded-3xl p-8 border border-amber-300 bg-white space-y-3">
                  <Truck className="w-10 h-10 text-[#E67E22]" />
                  <h2 className="text-xl font-bold text-[#1F2937]">Logistics Dashboard</h2>
                  <p className="text-sm text-[#4B5563]">Available deals from real trade agreements are listed here. Each accepted job is claimed once and then moves to buyer approval.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {logisticsLoading ? (
                    <div className="col-span-full text-sm text-[#4B5563]">Loading transport jobs…</div>
                  ) : logisticsJobs.length === 0 ? (
                    <div className="col-span-full text-sm text-[#4B5563]">No available transport jobs right now.</div>
                  ) : (
                    logisticsJobs.map((job: any) => (
                      <div key={job.tradeDealId || job.id} className="clean-card rounded-3xl p-5 border border-[#F3F4F6] bg-white space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E67E22]">{job.dealCode || job.tradeDealId || 'DEAL'}</div>
                            <h3 className="text-lg font-bold text-[#1F2937]">{job.cropName || 'Crop'}</h3>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-[#FFF7ED] text-[#C2410C] text-[10px] font-bold uppercase">{job.status || 'AVAILABLE'}</span>
                        </div>

                        <div className="space-y-1 text-sm text-[#374151]">
                          <p><span className="font-semibold">Farmer:</span> {job.farmerId || '—'}</p>
                          <p><span className="font-semibold">Buyer:</span> {job.buyerId || '—'}</p>
                          <p><span className="font-semibold">Quantity:</span> {job.quantityQuintals || 0} Quintals</p>
                          <p><span className="font-semibold">Pickup:</span> {job.pickupLocation || '—'}</p>
                          <p><span className="font-semibold">Destination:</span> {job.deliveryLocation || '—'}</p>
                        </div>

                        {job.status === 'AVAILABLE' || job.status === 'AGREED' ? (
                          <button
                            onClick={() => handleAcceptJob(job.tradeDealId || job.id)}
                            className="w-full px-4 py-2 rounded-xl bg-[#E67E22] text-white text-sm font-bold hover:bg-[#C96A16] transition"
                          >
                            Accept Deal
                          </button>
                        ) : (
                          <div className="text-xs font-semibold text-[#6B7280]">Waiting for buyer confirmation or active shipment update.</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* FPO View */}
            {role === 'fpo' && (
              <FpoDashboard />
            )}

            {/* Admin / Assayer View */}
            {role === 'admin' && (
              <div className="clean-card rounded-3xl p-8 text-center space-y-4 border border-purple-200 bg-white">
                <ShieldCheck className="w-12 h-12 mx-auto text-purple-600" />
                <h2 className="text-xl font-bold text-[#1F2937]">APMC Regulatory & Assaying Console</h2>
                <p className="text-xs text-[#4B5563] max-w-xl mx-auto">
                  Audit live Mandi price transparency, monitor e-Way digital seals, verify third-party assaying disputes, and enforce zero-delay escrow payouts.
                </p>
                <div className="inline-flex items-center px-4 py-2 rounded-xl bg-[#DCFCE7] text-[#15803D] text-xs font-bold border border-[#86EFAC]">
                  ✅ All 12 active trading channels operating in compliance with WDRA and APMC guidelines.
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (Visible only on phone screens for 1-thumb ease) */}
      {role === 'farmer' && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] shadow-lg px-2 py-1.5 flex items-center justify-around">
          <button
            onClick={() => { setViewingMandiBuyers(null); setActiveTab('dashboard'); }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer touch-target ${
              activeTab === 'dashboard' && !viewingMandiBuyers
                ? 'text-[#2E7D32] font-extrabold'
                : 'text-[#6B7280]'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{t('home_nav')}</span>
          </button>

          <button
            onClick={() => { setViewingMandiBuyers(null); setActiveTab('orders'); }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition relative cursor-pointer touch-target ${
              activeTab === 'orders'
                ? 'text-[#2E7D32] font-extrabold'
                : 'text-[#6B7280]'
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{t('my_orders_nav')}</span>
            {pendingFarmerOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#15803D] absolute top-1 right-2" />
            )}
          </button>

          <button
            onClick={() => { setViewingMandiBuyers(null); setActiveTab('demands'); }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer touch-target ${
              activeTab === 'demands'
                ? 'text-[#2E7D32] font-extrabold'
                : 'text-[#6B7280]'
            }`}
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{t('demands_nav')}</span>
          </button>

          <button
            onClick={() => setIsQualityModalOpen(true)}
            className="flex flex-col items-center py-1 px-2 rounded-xl text-[#15803D] cursor-pointer touch-target"
          >
            <Scan className="w-5 h-5 mb-0.5 text-[#15803D]" />
            <span className="text-[10px] font-bold">Quality</span>
          </button>

          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="flex flex-col items-center py-1 px-2 rounded-xl text-[#2563EB] cursor-pointer touch-target"
          >
            <Warehouse className="w-5 h-5 mb-0.5 text-[#2563EB]" />
            <span className="text-[10px]">Storage</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6 mt-12 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#1F2937]">KisanSetu Platform</span>
            <span>•</span>
            <span>AgriTech Market Intelligence & Smart Trade Engine</span>
          </div>
          <div>
            Empowering Indian Farmers, FPOs & Verified Buyers with Live Transparency
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {isQualityModalOpen && (
        <AiQualityAssessorModal onClose={() => setIsQualityModalOpen(false)} />
      )}

      {isStorageModalOpen && (
        <StorageFinderModal onClose={() => setIsStorageModalOpen(false)} />
      )}

      {/* Global User Authentication, Registration & Forgot Password Modal */}
      <AuthModal />

    </div>
  );
};

