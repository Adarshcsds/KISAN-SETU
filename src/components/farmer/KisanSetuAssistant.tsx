import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  LoaderCircle,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { KisanSetuApi } from '../../services/api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const suggestions = [
  'Should I sell my crop?',
  'How much profit can I make?',
  'Where is my order?',
  'How should I take care of my crop?',
];

export const KisanSetuAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest message visible
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  const sendMessage = async (
    event?: React.FormEvent,
    suggestedMessage?: string
  ) => {
    event?.preventDefault();

    const message = (suggestedMessage ?? input).trim();

    if (!message || isLoading) {
      return;
    }

    setInput('');
    setError('');
    setIsLoading(true);

    // Add farmer's message immediately
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      text: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    try {
      /*
       * KisanSetuApi.chat() already:
       *
       * 1. Gets the logged-in farmer's token
       * 2. Sends Authorization: Bearer <token>
       * 3. Calls POST /api/chat
       *
       * Therefore authentication is intentionally NOT handled here.
       */
      const response = await KisanSetuApi.chat(message);

      if (!response || !response.reply) {
        throw new Error(
          'The KisanSetu Assistant did not return an answer.'
        );
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.reply,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (requestError) {
      console.error(
        '[KisanSetuAssistant] Chat request failed:',
        requestError
      );

      let errorMessage =
        'Unable to connect to the KisanSetu Assistant.';

      if (requestError instanceof Error) {
        errorMessage = requestError.message;
      }

      /*
       * If the backend returns an authentication error,
       * show a clear message to the farmer.
       */
      if (
        errorMessage.toLowerCase().includes('401') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.toLowerCase().includes('token')
      ) {
        errorMessage =
          'Please login as a farmer to use the KisanSetu Assistant.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError('');
    setInput('');
  };

  return (
    <section
      className="clean-card p-5 sm:p-6 space-y-4"
      aria-labelledby="kisansetu-assistant-title"
    >
      {/* ------------------------------------------------------------ */}
      {/* HEADER                                                        */}
      {/* ------------------------------------------------------------ */}

      <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#86EFAC]
                       flex items-center justify-center text-[#15803D] flex-shrink-0"
          >
            <Bot className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id="kisansetu-assistant-title"
                className="text-base sm:text-lg font-bold text-[#1F2937]"
              >
                KisanSetu AI Assistant
              </h2>

              <Sparkles
                className="w-4 h-4 text-[#15803D] flex-shrink-0"
                aria-hidden="true"
              />
            </div>

            <p className="text-xs text-[#4B5563]">
              Ask about your crop, prices, orders or earnings
            </p>
          </div>
        </div>

        {/* Clear conversation */}
        <button
          type="button"
          onClick={clearConversation}
          disabled={messages.length === 0 && !error}
          className="
            p-2 rounded-lg
            text-[#4B5563]
            hover:text-[#1F2937]
            hover:bg-[#F3F4F6]
            disabled:opacity-40
            transition
            flex-shrink-0
          "
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* CHAT AREA                                                      */}
      {/* ------------------------------------------------------------ */}

      <div
        className="
          min-h-28
          max-h-80
          overflow-y-auto
          space-y-3
          pr-1
        "
        aria-live="polite"
        aria-label="KisanSetu Assistant conversation"
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div
            className="
              rounded-xl
              bg-[#F9FAFB]
              border border-[#E5E7EB]
              p-4
            "
          >
            <div className="flex items-start gap-3">
              <Bot
                className="w-5 h-5 text-[#15803D] mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-semibold text-[#1F2937]">
                  Namaste! 👋
                </p>

                <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                  Ask me about your crop, mandi prices,
                  earnings, orders or shipments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${
              message.role === 'user'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            {/* Assistant icon */}
            {message.role === 'assistant' && (
              <Bot
                className="
                  w-4 h-4
                  text-[#15803D]
                  mt-2
                  flex-shrink-0
                "
                aria-hidden="true"
              />
            )}

            {/* Message */}
            <div
              className={`
                max-w-[88%]
                rounded-xl
                px-3
                py-2.5
                text-xs
                leading-relaxed
                whitespace-pre-line
                break-words
                ${
                  message.role === 'user'
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB]'
                }
              `}
            >
              {message.text}
            </div>

            {/* User icon */}
            {message.role === 'user' && (
              <User
                className="
                  w-4 h-4
                  text-[#2E7D32]
                  mt-2
                  flex-shrink-0
                "
                aria-hidden="true"
              />
            )}
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#4B5563]">
            <LoaderCircle
              className="w-4 h-4 text-[#15803D] animate-spin"
              aria-hidden="true"
            />

            <span>Preparing your answer...</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ------------------------------------------------------------ */}
      {/* ERROR                                                         */}
      {/* ------------------------------------------------------------ */}

      {error && (
        <div
          className="
            text-xs
            text-[#B91C1C]
            bg-[#FEE2E2]
            border border-[#FCA5A5]
            rounded-lg
            p-3
          "
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* QUICK QUESTIONS                                               */}
      {/* ------------------------------------------------------------ */}

      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2">
          Quick questions
        </p>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() =>
                sendMessage(undefined, suggestion)
              }
              disabled={isLoading}
              className="
                px-3
                py-2
                rounded-lg
                bg-[#F9FAFB]
                border border-[#D1D5DB]
                text-[#374151]
                text-[11px]
                font-semibold
                hover:bg-[#F3F4F6]
                hover:border-[#9CA3AF]
                disabled:opacity-50
                transition
              "
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* INPUT                                                          */}
      {/* ------------------------------------------------------------ */}

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          disabled={isLoading}
          maxLength={2000}
          placeholder="Ask KisanSetu..."
          aria-label="Ask KisanSetu Assistant"
          className="
            flex-1
            min-w-0
            bg-white
            border border-[#D1D5DB]
            rounded-xl
            px-3
            py-2.5
            text-xs
            text-[#1F2937]
            placeholder-[#4B5563]
            focus:outline-none
            focus:border-[#2E7D32]
            focus:ring-1
            focus:ring-[#2E7D32]
          "
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="
            p-2.5
            rounded-xl
            bg-[#2E7D32]
            text-white
            hover:bg-[#1E5128]
            disabled:opacity-50
            transition
            flex-shrink-0
          "
          aria-label="Send message"
          title="Send message"
        >
          {isLoading ? (
            <LoaderCircle
              className="w-4 h-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Send
              className="w-4 h-4"
              aria-hidden="true"
            />
          )}
        </button>
      </form>

      {/* ------------------------------------------------------------ */}
      {/* DATA / TRUST MESSAGE                                          */}
      {/* ------------------------------------------------------------ */}

      <div className="flex items-start gap-1.5 text-[10px] text-[#4B5563]">
        <Check
          className="w-3 h-3 text-[#15803D] mt-0.5 flex-shrink-0"
          aria-hidden="true"
        />

        <span>
          Answers use available KisanSetu records and AI guidance.
        </span>
      </div>
    </section>
  );
};