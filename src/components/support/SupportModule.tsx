import React, { useEffect, useState } from 'react';
import { AlertCircle, Headphones, MessageSquareWarning, Phone, Star } from 'lucide-react';
import { KisanSetuApi, SupportTicket, TradeFeedback, TradeIssue } from '../../services/api';

const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE || '+911800000000';
const ISSUE_TYPES = ['Payment', 'Quality', 'Quantity', 'Pricing', 'Delivery', 'Logistics', 'Buyer/Farmer behaviour', 'Other'];
const SUPPORT_TYPES = ['Account', 'Payment', 'App Problem', 'Market Information', 'Order', 'Logistics', 'Negotiation', 'Other'];

const Notice = ({ message }: { message: string | null }) => message ? <p className="text-xs font-semibold text-[#15803D]">✓ {message}</p> : null;

export const OrderSupportActions: React.FC<{ tradeDealId: string }> = ({ tradeDealId }) => {
  const token = localStorage.getItem('kisansetu_access_token') || '';
  const [mode, setMode] = useState<'feedback' | 'issue' | null>(null);
  const [rating, setRating] = useState(5);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<TradeFeedback[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([KisanSetuApi.getTradeFeedback(token), KisanSetuApi.me(token)])
      .then(([feedbackRows, user]) => { setFeedback(feedbackRows); setUserId(user.id); })
      .catch(() => undefined);
  }, [token]);
  const alreadySubmitted = feedback.some((item) => item.tradeDealId === tradeDealId && item.reviewerUserId === userId);
  const submit = async () => {
    if (!token) { setError('Please log in to use support.'); return; }
    if (mode === 'issue' && !description.trim()) { setError('Please describe the issue.'); return; }
    try {
      setSaving(true); setError(null);
      if (mode === 'feedback') {
        await KisanSetuApi.createTradeFeedback(token, { trade_deal_id: tradeDealId, rating, comment: description.trim() || undefined });
        setFeedback(await KisanSetuApi.getTradeFeedback(token)); setNotice('Feedback submitted successfully.');
      } else if (mode === 'issue') {
        await KisanSetuApi.createTradeIssue(token, { trade_deal_id: tradeDealId, issue_type: issueType, description: description.trim() });
        setNotice('Issue submitted successfully.');
      }
      setMode(null); setDescription('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit your request.'); }
    finally { setSaving(false); }
  };
  return <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2">
    <div className="flex flex-wrap gap-2">
      <button disabled={alreadySubmitted} onClick={() => { setMode('feedback'); setError(null); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#86EFAC] text-[#15803D] bg-[#F0FDF4] disabled:opacity-60">{alreadySubmitted ? 'Feedback Submitted' : 'Give Feedback'}</button>
      <button onClick={() => { setMode('issue'); setError(null); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#FCD34D] text-[#B45309] bg-[#FFFBEB]">Report Issue</button>
    </div>
    <Notice message={notice} />
    {mode && <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3 space-y-2">
      <p className="text-xs font-bold">{mode === 'feedback' ? 'Give Feedback' : 'Report an Issue'}</p>
      {mode === 'feedback' ? <div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setRating(value)} aria-label={`${value} stars`}><Star className={`w-5 h-5 ${value <= rating ? 'fill-[#EAB308] text-[#EAB308]' : 'text-[#D1D5DB]'}`} /></button>)}</div> : <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] p-2 text-xs">{ISSUE_TYPES.map((type) => <option key={type}>{type}</option>)}</select>}
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={mode === 'feedback' ? 'Comment (optional)' : 'Describe the issue'} className="w-full rounded-lg border border-[#D1D5DB] p-2 text-xs" rows={3} />
      {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
      <div className="flex gap-2"><button disabled={saving} onClick={submit} className="px-3 py-1.5 rounded-lg bg-[#2E7D32] text-white text-xs font-bold disabled:opacity-60">{saving ? 'Submitting…' : 'Submit'}</button><button onClick={() => setMode(null)} className="text-xs font-bold text-[#6B7280]">Cancel</button></div>
    </div>}
  </div>;
};

export const HelpSupport: React.FC = () => {
  const token = localStorage.getItem('kisansetu_access_token') || '';
  const [tickets, setTickets] = useState<SupportTicket[]>([]); const [issues, setIssues] = useState<TradeIssue[]>([]);
  const [issueType, setIssueType] = useState(SUPPORT_TYPES[0]); const [description, setDescription] = useState(''); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const load = async () => { if (!token) return; try { const [ticketRows, issueRows] = await Promise.all([KisanSetuApi.getSupportTickets(token), KisanSetuApi.getTradeIssues(token)]); setTickets(ticketRows); setIssues(issueRows); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load support requests.'); } };
  useEffect(() => { load(); }, []);
  const submit = async () => { if (!description.trim()) { setError('Please describe your support request.'); return; } try { setSaving(true); setError(null); await KisanSetuApi.createSupportTicket(token, { issue_type: issueType, description: description.trim() }); setDescription(''); setMessage('Support request submitted successfully.'); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit your request.'); } finally { setSaving(false); } };
  return <div className="space-y-6 max-w-3xl">
    <div className="clean-card p-6 flex gap-3"><Headphones className="w-7 h-7 text-[#15803D]" /><div><h1 className="text-xl font-bold">Help & Support</h1><p className="text-sm text-[#6B7280]">Get help with your KisanSetu account and trades.</p></div></div>
    <div className="clean-card p-5 space-y-3"><div className="flex items-center gap-2"><Phone className="w-5 h-5 text-[#15803D]" /><h2 className="font-bold">Customer Care</h2></div><p className="text-sm text-[#6B7280]">Talk directly to KisanSetu support.</p><a href={`tel:${SUPPORT_PHONE}`} className="inline-flex px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-bold">Call Customer Care</a></div>
    <div className="clean-card p-5 space-y-3"><div className="flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-[#B45309]" /><h2 className="font-bold">Raise a General Support Request</h2></div><select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] p-2 text-sm">{SUPPORT_TYPES.map((type) => <option key={type}>{type}</option>)}</select><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem" className="w-full rounded-lg border border-[#D1D5DB] p-2 text-sm" rows={4} />{error && <p className="text-xs text-[#B91C1C] flex gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}<Notice message={message} /><button disabled={saving} onClick={submit} className="px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-bold disabled:opacity-60">{saving ? 'Submitting…' : 'Submit Request'}</button></div>
    <div className="clean-card p-5 space-y-3"><h2 className="font-bold">My Support Requests</h2>{[...tickets, ...issues].length === 0 ? <p className="text-sm text-[#6B7280]">No support requests yet.</p> : [...tickets, ...issues].map((item) => <div key={item.id} className="border-t border-[#E5E7EB] pt-3 text-sm"><div className="flex justify-between gap-2"><span className="font-mono font-bold">{item.id}</span><span className="text-xs font-bold text-[#15803D]">{item.status}</span></div><p className="font-semibold">{item.issueType}</p><p className="text-xs text-[#6B7280]">{item.description}</p></div>)}</div>
  </div>;
};
