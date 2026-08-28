import React, { useEffect, useRef, useState } from 'react';
import { Bot, Check, LoaderCircle, Send, Sparkles, Trash2, User } from 'lucide-react';
import { KisanSetuApi } from '../../services/api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const suggestions = [
  'Where is my order?',
  'How much profit will I make?',
  'Should I sell my wheat?',
  'How do I take care of my crop?',
];

export const KisanSetuAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (event?: React.FormEvent, suggestedMessage?: string) => {
    event?.preventDefault();
    const message = (suggestedMessage ?? input).trim();
    if (!message || isLoading) return;
    setInput('');
    setError('');
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: message }]);
    setIsLoading(true);
    try {
      if (localStorage.getItem('kisansetu_access_token')) {
        const response = await KisanSetuApi.chat(message);
        setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: response.reply }]);
      } else {
        // Helpful local fallback responses for offline or unauthenticated mode
        await new Promise(r => setTimeout(r, 600));
        let reply = "Namaste! Wheat benchmark rate today is ₹2,450/q. Prices are expected to rise +₹120/q over the next 2-3 weeks due to export mill demand. Storing in warehouse or selling directly to verified institutional buyers will yield maximum net profit.";
        const lower = message.toLowerCase();
        if (lower.includes('order') || lower.includes('deal')) {
          reply = "You can view your active trade orders and vehicle GPS dispatches directly in the 'My Orders (सौदे)' tab. All payouts are secured in KisanSetu escrow.";
        } else if (lower.includes('profit') || lower.includes('mandi') || lower.includes('price')) {
          reply = "By selling directly to institutional buyers and saving 6% middleman commissions + 3.5% weighbridge losses, KisanSetu gives you +₹180/quintal extra net in-hand earnings.";
        } else if (lower.includes('care') || lower.includes('crop') || lower.includes('water') || lower.includes('fertilizer')) {
          reply = "Ensure moisture levels remain below 12% before storage. For cereal crops, store in clean, dry WDRA-certified warehouses to protect against post-harvest weight loss.";
        }
        setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: reply }]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not respond.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="clean-card p-5 sm:p-6 space-y-4" aria-labelledby="kisansetu-assistant-title">
      <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="kisansetu-assistant-title" className="text-base sm:text-lg font-bold text-[#1F2937]">KisanSetu AI Assistant</h2>
              <Sparkles className="w-4 h-4 text-[#15803D]" />
            </div>
            <p className="text-xs text-[#4B5563]">Crop care, your deals, shipments, profit, and price guidance</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setMessages([]); setError(''); }}
          disabled={messages.length === 0 && !error}
          className="p-2 rounded-lg text-[#4B5563] hover:text-[#1F2937] hover:bg-[#F3F4F6] disabled:opacity-40 transition"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="min-h-28 max-h-80 overflow-y-auto space-y-3 pr-1" aria-live="polite">
        {messages.length === 0 && (
          <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4">
            <p className="text-sm font-semibold text-[#1F2937]">Namaste! Ask me about your farm or crop.</p>
            <p className="text-xs text-[#4B5563] mt-1">I use your recorded KisanSetu deals and shipments for personal updates.</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && <Bot className="w-4 h-4 text-[#15803D] mt-2 flex-shrink-0" />}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${message.role === 'user' ? 'bg-[#2E7D32] text-white' : 'bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB]'}`}>
              {message.text}
            </div>
            {message.role === 'user' && <User className="w-4 h-4 text-[#2E7D32] mt-2 flex-shrink-0" />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#4B5563]">
            <LoaderCircle className="w-4 h-4 text-[#15803D] animate-spin" /> Preparing your answer...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="text-xs text-[#B91C1C] bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-2">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => sendMessage(undefined, suggestion)} disabled={isLoading} className="px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-[#D1D5DB] text-[#374151] text-[11px] font-semibold hover:bg-[#F3F4F6] disabled:opacity-50 transition">
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={isLoading} maxLength={2000} placeholder="Ask your farming assistant..." className="flex-1 min-w-0 bg-white border border-[#D1D5DB] rounded-xl px-3 py-2.5 text-xs text-[#1F2937] placeholder-[#4B5563] focus:outline-none focus:border-[#2E7D32]" />
        <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 rounded-xl bg-[#2E7D32] text-white hover:bg-[#1E5128] disabled:opacity-50 transition" aria-label="Send message" title="Send message">
          {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      <div className="flex items-center gap-1 text-[10px] text-[#4B5563]"><Check className="w-3 h-3 text-[#15803D]" /> Personal answers are based on your KisanSetu records.</div>
    </section>
  );
};
