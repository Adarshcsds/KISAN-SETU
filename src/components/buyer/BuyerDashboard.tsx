import React, { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, Loader, PackageCheck, ShieldCheck } from 'lucide-react';
import { KisanSetuApi } from '../../services/api';
import { BuyerDemandWorkflow } from './BuyerDemandWorkflow';
import { TransportApprovalSection } from './TransportApprovalSection';
import { OrderSupportActions } from '../support/SupportModule';
import { BuyerPayments } from '../payments/BuyerPayments';

type Deal = { id: string; dealCode: string; cropName: string; agreedQuantityQuintals: number; grossAmount: number };
type Payment = { tradeDealId: string; amount: number; status: string; transactionReference: string; releaseReference?: string };

export const BuyerDashboard: React.FC = () => {
  const token = localStorage.getItem('kisansetu_access_token') || '';
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = async () => { try { setLoading(true); const [ds, ps] = await Promise.all([KisanSetuApi.getDeals(token), KisanSetuApi.getPayments(token)]); setDeals(ds || []); setPayments(ps || []); setError(null); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load buyer records.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const act = async (dealId: string, action: 'secure' | 'release') => { try { setBusy(dealId); await (action === 'secure' ? KisanSetuApi.securePayment(token, dealId) : KisanSetuApi.releasePayment(token, dealId)); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Payment action failed.'); } finally { setBusy(null); } };
  const paymentByDeal = new Map(payments.map((payment) => [payment.tradeDealId, payment]));

  return <div className="space-y-6">
    <div className="clean-card p-6 flex gap-3 items-center"><span className="p-2 rounded-xl bg-[#DCFCE7] text-[#15803D]"><PackageCheck className="w-6 h-6" /></span><div><h1 className="text-xl font-bold">Buyer Workspace</h1><p className="text-sm text-[#6B7280]">Buyer demands, farmer offers, payments, and transport approval.</p></div></div>
    {error && <div className="clean-card p-4 bg-[#FEE2E2] border border-[#FECACA] flex gap-3"><AlertCircle className="w-5 h-5 text-[#DC2626]" /><p className="text-sm text-[#991B1B]">{error}</p></div>}
    <BuyerDemandWorkflow />
    <BuyerPayments />
    <section className="space-y-3"><div className="flex gap-2 items-center"><CreditCard className="w-5 h-5 text-[#1D4ED8]" /><h2 className="text-lg font-bold">Payments & Escrow</h2></div>{loading ? <div className="clean-card p-6 text-center"><Loader className="w-5 h-5 animate-spin mx-auto text-[#1D4ED8]" /></div> : deals.length === 0 ? <div className="clean-card p-5 text-sm text-[#6B7280]">Agreed deals will appear here after a farmer offer is accepted.</div> : <div className="grid gap-4 md:grid-cols-2">{deals.map((deal) => { const payment = paymentByDeal.get(deal.id); return <div key={deal.id} className="clean-card p-5 space-y-3"><div className="flex justify-between"><div><div className="font-bold">{deal.dealCode}</div><div className="text-sm text-[#6B7280]">{deal.cropName} · {deal.agreedQuantityQuintals} Qtl</div></div><span className="text-xs font-bold px-2 py-1 rounded bg-[#F3F4F6] h-fit">{payment?.status || 'PENDING'}</span></div><div className="text-lg font-bold text-[#15803D]">₹{(payment?.amount ?? deal.grossAmount).toLocaleString('en-IN')}</div>{payment ? <div className="text-xs text-[#6B7280]"><p>Sandbox reference: {payment.transactionReference}</p>{payment.releaseReference && <p>Release reference: {payment.releaseReference}</p>}{payment.status === 'LOCKED' && <button disabled={busy === deal.id} onClick={() => act(deal.id, 'release')} className="mt-3 w-full rounded-lg bg-[#1D4ED8] text-white py-2 font-bold disabled:opacity-50">{busy === deal.id ? 'Processing…' : 'Release after delivery'}</button>}</div> : <button disabled={busy === deal.id} onClick={() => act(deal.id, 'secure')} className="w-full rounded-lg bg-[#15803D] text-white py-2 font-bold disabled:opacity-50">{busy === deal.id ? 'Securing…' : 'Secure Payment'}</button>}</div>; })}</div>}</section>
    <div className="clean-card p-4 bg-[#EFF6FF] border border-[#BFDBFE] text-sm text-[#1E40AF] flex gap-2"><ShieldCheck className="w-5 h-5 flex-none" /><span><strong>KisanSetu Payment Sandbox.</strong> Demo transaction — no real money transferred. The server calculates every amount from the agreed deal.</span></div>
    <section className="space-y-3"><h2 className="text-lg font-bold">Deal Feedback & Issues</h2>{loading ? null : deals.length === 0 ? <div className="clean-card p-5 text-sm text-[#6B7280]">Your authenticated trade deals will appear here.</div> : <div className="grid gap-4 md:grid-cols-2">{deals.map((deal) => <div key={deal.id} className="clean-card p-5"><div className="font-bold">{deal.dealCode}</div><div className="text-sm text-[#6B7280]">{deal.cropName} · {deal.agreedQuantityQuintals} Qtl</div><OrderSupportActions tradeDealId={deal.id} /></div>)}</div>}</section>
    <section className="space-y-3"><h2 className="text-lg font-bold">Logistics Approval</h2><TransportApprovalSection token={token} /></section>
  </div>;
};
