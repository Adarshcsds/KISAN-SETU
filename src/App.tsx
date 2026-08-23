import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { MarketBuyersView } from './components/farmer/MarketBuyersView';
import { FarmerOrdersList } from './components/farmer/FarmerOrdersList';
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
  Truck
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

  const pendingFarmerOrdersCount = orders.filter(o => o.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-[#08100d] text-slate-100 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Sub Navigation Tabs for Farmer / Buyer */}
      <div className="bg-dark-850/60 border-b border-slate-800/80 backdrop-blur-sm sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
            
            <div className="flex items-center space-x-2">
              
              {role === 'farmer' && (
                <>
                  <button
                    onClick={() => { setViewingMandiBuyers(null); setActiveTab('dashboard'); }}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'dashboard' && !viewingMandiBuyers
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-750'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('farmer_role')} {t('back_to_dashboard') ? '' : 'Dashboard'}</span>
                  </button>

                  <button
                    onClick={() => { setViewingMandiBuyers(null); setActiveTab('orders'); }}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition relative ${
                      activeTab === 'orders'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-750'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>{t('active_orders')}</span>
                    {pendingFarmerOrdersCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => setIsStorageModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-dark-750 transition"
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>{t('warehouse_cold_storage')}</span>
                  </button>

                  <button
                    onClick={() => setIsQualityModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-800/40 rounded-xl transition"
                  >
                    <Scan className="w-4 h-4" />
                    <span>{t('ai_quality_assayer')}</span>
                  </button>
                </>
              )}

              {role === 'buyer' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('buyer_role')}</span>
                  </button>
                </>
              )}

              {role === 'fpo' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-950"
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
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md shadow-purple-950"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('admin_role')}</span>
                  </button>
                </>
              )}

            </div>

            {/* Help & Workflow Guide Pill */}
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
              <span className="text-[11px] font-mono bg-dark-800 px-2.5 py-1 rounded-lg border border-slate-700">
                End-to-End Simulation: Active
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
              </>
            )}

            {/* Buyer View */}
            {role === 'buyer' && (
              <BuyerDashboard />
            )}

            {/* FPO View */}
            {role === 'fpo' && (
              <FpoDashboard />
            )}

            {/* Admin / Assayer View */}
            {role === 'admin' && (
              <div className="glass-card rounded-3xl p-8 text-center space-y-4 border border-purple-800/60">
                <ShieldCheck className="w-12 h-12 mx-auto text-purple-400" />
                <h2 className="text-xl font-bold text-white">APMC Regulatory & Assaying Console</h2>
                <p className="text-xs text-slate-300 max-w-xl mx-auto">
                  Audit live Mandi price transparency, monitor e-Way digital seals, verify third-party assaying disputes, and enforce zero-delay escrow payouts.
                </p>
                <div className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
                  ✅ All 12 active trading channels operating in compliance with WDRA and APMC guidelines.
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-emerald-950/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300 font-display">KisanSetu Platform</span>
            <span>•</span>
            <span>AgriTech Market Intelligence & Smart Trade Engine</span>
          </div>
          <div>
            Empowering Smallholders, FPOs & Verified Institutional Buyers with Data Transparency
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
