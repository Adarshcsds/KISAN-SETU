import React, { useEffect, useState } from 'react';
import { KisanSetuApi } from '../../services/api';

type Payment = { dealCode: string; cropName: string; quantityQuintals: number; amount: number; status: string; releaseReference?: string };
export const FarmerPaymentSummary: React.FC = () => {
  const token = localStorage.getItem('kisansetu_access_token') || ''; const [payments, setPayments] = useState<Payment[]>([]); const [error, setError] = useState('');
  useEffect(() => { KisanSetuApi.getPayments(token).then(setPayments).catch((e) => setError(e instanceof Error ? e.message : 'Could not load payments.')); }, []);
  return <section className="space-y-3"><div><h2 className="text-lg font-bold">Payments</h2><p className="text-xs text-[#6B7280]">Demo payment status for authenticated trade deals.</p></div>{error && <p className="text-xs text-[#B91C1C]">{error}</p>}{payments.length === 0 ? <div className="clean-card p-4 text-sm text-[#6B7280]">No trade payments yet.</div> : <div className="grid gap-3 md:grid-cols-2">{payments.map((payment) => <div key={payment.dealCode} className="clean-card p-4 text-sm space-y-1"><div className="flex justify-between gap-2"><b>{payment.dealCode}</b><span className={`text-xs font-bold ${payment.status === 'RELEASED' ? 'text-[#15803D]' : 'text-[#B45309]'}`}>{payment.status === 'RELEASED' ? 'PAID' : payment.status}</span></div><p className="text-xs text-[#6B7280]">{payment.cropName} · {payment.quantityQuintals} Qtl</p><p className="font-bold text-[#15803D]">₹{payment.amount.toLocaleString('en-IN')}</p>{payment.releaseReference && <p className="text-xs text-[#6B7280]">Reference: {payment.releaseReference}</p>}</div>)}</div>}</section>;
};
