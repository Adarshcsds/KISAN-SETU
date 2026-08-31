import React, { useEffect, useState } from 'react';
import { KisanSetuApi } from '../../services/api';

type Offer = { id: string; offeredQuantityQuintals: number; offeredPricePerQuintal: number; qualityGrade: string; status: string };
type Props = { offer: Offer; role: 'farmer' | 'buyer'; onChanged: () => Promise<void> | void };

export const NegotiationPanel: React.FC<Props> = ({ offer, role, onChanged }) => {
  const token = localStorage.getItem('kisansetu_access_token') || '';
  const [data, setData] = useState<any>(null); const [price, setPrice] = useState(String(offer.offeredPricePerQuintal));
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const load = async () => { try { setData(await KisanSetuApi.getNegotiationHistory(token, offer.id)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load negotiation history.'); } };
  useEffect(() => { setPrice(String(offer.offeredPricePerQuintal)); load(); }, [offer.id]);
  const myOffers = role === 'farmer' ? data?.farmerOffers ?? 0 : data?.buyerOffers ?? 0;
  const myTurn = data && ((role === 'buyer' && data.status === 'PENDING') || (role === 'farmer' && data.status === 'COUNTERED'));
  const submit = async (action: 'accept' | 'reject' | 'counter') => {
    try { setBusy(true); setError(''); const amount = Number(price); if (action === 'counter' && (!Number.isFinite(amount) || amount <= 0)) { setError('Enter a valid price.'); return; }
      await KisanSetuApi.respondToOffer(token, offer.id, action, action === 'counter' ? { offeredQuantityQuintals: offer.offeredQuantityQuintals, offeredPricePerQuintal: amount, qualityGrade: offer.qualityGrade, message: `${role === 'farmer' ? 'Farmer' : 'Buyer'} counter offer` } : undefined);
      await onChanged(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Negotiation action failed.'); } finally { setBusy(false); }
  };
  return <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-2">
    <div className="flex justify-between gap-2"><b className="text-xs">Negotiation</b><span className="text-[11px] text-[#6B7280]">Your offers: {myOffers}/2</span></div>
    {data?.history?.map((item: any) => <div key={item.id} className="flex justify-between text-xs"><span>{item.offeredByRole === 'farmer' ? 'Farmer' : 'Buyer'} offer</span><b>₹{item.offeredPrice.toLocaleString('en-IN')}/Qtl</b></div>)}
    <div className="border-t border-[#E5E7EB] pt-2 text-xs"><span className="text-[#6B7280]">Current offer: </span><b>₹{(data?.currentPrice ?? offer.offeredPricePerQuintal).toLocaleString('en-IN')}/Qtl</b></div>
    {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
    {myTurn ? <div className="space-y-2"><input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-2 py-1.5 text-xs" aria-label="Counter offer price" /><div className="flex flex-wrap gap-2"><button disabled={busy || myOffers >= 2} onClick={() => submit('counter')} className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs font-bold disabled:opacity-50">Counter Offer</button><button disabled={busy} onClick={() => submit('accept')} className="rounded-lg bg-[#15803D] px-2.5 py-1.5 text-xs font-bold text-white">Accept</button><button disabled={busy} onClick={() => submit('reject')} className="rounded-lg bg-[#FEE2E2] px-2.5 py-1.5 text-xs font-bold text-[#B91C1C]">Reject</button></div>{myOffers >= 2 && <p className="text-[11px] text-[#6B7280]">Your two offers have been used; you can still accept or reject.</p>}</div> : <p className="text-xs text-[#6B7280]">{data?.status === 'ACCEPTED' || data?.status === 'REJECTED' ? `Negotiation ${data.status.toLowerCase()}.` : `Waiting for ${role === 'farmer' ? 'buyer' : 'farmer'} response.`}</p>}
  </div>;
};
