import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, ExternalLink, Loader2, MessageSquare, Send, Sparkles } from 'lucide-react';
import { CopilotSuggestion } from './SharedComponents';
import { chatWithRag, RagSource } from '../../service/ragService';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: RagSource[];
}

interface RagChatPanelProps {
  onClose: () => void;
  currentUserName: string;
}

const quickPrompts = [
  'Tôi muốn xin nghỉ phép',
  'Tôi muốn tìm hiểu về các chính sách bảo hiểm của công ty đối với nhân viên',
];

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${isUser ? 'bg-teams-purple text-white' : 'border border-teams-border bg-white text-text-main'}`}>
        <div className={`mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] ${isUser ? 'text-white/80' : 'text-teams-purple'}`}>
          {isUser ? <MessageSquare size={11} /> : <Bot size={11} />}
          <span>{isUser ? 'Bạn' : 'Bot'}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t border-teams-border/80 pt-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Sources</div>
            <div className="space-y-2">
              {message.sources.map((source) => (
                <button
                  key={`${source.source}-${source.type ?? 'unknown'}`}
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(source.source);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-teams-border bg-gray-50 px-3 py-2 text-left text-xs transition-colors hover:border-teams-purple hover:bg-teams-purple/5"
                  title={`Sao chép nguồn: ${source.source}`}
                >
                  <span className="min-w-0 flex-1 truncate font-semibold text-text-main">{source.source}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-teams-purple inline-flex items-center gap-1">
                    <ExternalLink size={11} />
                    Bấm để sao chép
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export const RagChatPanel: React.FC<RagChatPanelProps> = ({ onClose, currentUserName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content: 'Chào bạn. Hãy nhập câu hỏi, tôi sẽ truy xuất câu trả lời từ hệ thống RAG và hiển thị các nguồn liên quan.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Current messages:', messages);

    const question = input.trim();
    if (!question || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: question,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatWithRag(question);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: 'assistant',
          content: result.answer || 'Không nhận được câu trả lời từ hệ thống RAG.',
          sources: result.sources,
        },
      ]);
    } catch (error) {
      console.error('Failed to chat with RAG', error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: 'assistant',
          content: 'Không thể lấy phản hồi từ backend RAG. Vui lòng thử lại sau.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="relative z-10 flex flex-col border-l border-teams-border bg-white"
      aria-label="Chatbot RAG"
      role="complementary"
    >
      <div className="border-b border-teams-border bg-linear-to-r from-[#F8F4FF] via-white to-[#FFF5FB] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-teams-purple">
              <Sparkles size={11} />
              RAG Chatbot
            </div>
            <h2 className="mt-2 truncate text-sm font-black text-text-main">Hỏi nhanh từ kho tài liệu</h2>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Trò chuyện với hệ thống RAG, chỉ gửi câu hỏi và nhận câu trả lời kèm nguồn tham chiếu.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-teams-border bg-white p-2 text-gray-500 transition-colors hover:border-teams-purple hover:text-teams-purple"
            aria-label="Đóng chatbot"
          >
            <ArrowRight size={14} className="rotate-180" />
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-teams-border bg-white/80 px-3 py-2 text-xs text-text-secondary">
          <span className="font-bold text-text-main">{currentUserName}</span>, bạn có thể hỏi về văn bản, quy trình, tờ trình hoặc nội dung đã có trong kho.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFF_100%)] px-4 py-4 custom-scrollbar">
        <div className="space-y-3">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {loading && (
            <article className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-teams-border bg-white px-4 py-3 shadow-sm">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-teams-purple">
                  <Loader2 size={11} className="animate-spin" />
                  Bot
                </div>
                <p className="text-sm text-text-secondary">Bot đang trả lời...</p>
              </div>
            </article>
          )}

          <div ref={scrollAnchorRef} />
        </div>
      </div>

      <div className="border-t border-teams-border bg-white px-4 py-4">
        <div className="mb-3 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-text-secondary">Gợi ý nhanh</div>
          {quickPrompts.map((prompt) => (
            <CopilotSuggestion key={prompt} text={prompt} onClick={() => setInput(prompt)} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-2xl border border-teams-border bg-gray-50 p-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập câu hỏi cho RAG..."
              type="text"
              disabled={loading}
              className="w-full border-0 bg-transparent px-2 py-3 text-sm text-text-main outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teams-purple px-4 py-3 text-sm font-bold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Đang gửi...' : 'Gửi câu hỏi'}
          </button>

          <p className="text-[11px] leading-5 text-text-secondary">
            Hệ thống chỉ gửi trường question tới backend, còn AI và truy xuất nguồn được xử lý ở backend.
          </p>
        </form>
      </div>
    </motion.aside>
  );
};