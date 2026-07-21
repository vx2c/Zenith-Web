import { useEffect, useRef, useState } from 'react';
import { Copy, RefreshCw, Check, Send } from 'lucide-react';
import { type Lang, t } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeSnippet: string | null;
  codeLanguage: string | null;
  createdAt: string;
}

interface ThinkingStep {
  id: number;
  label: string;
}

interface ChatAreaProps {
  lang: Lang;
  sessionTitle: string;
  messages: Message[];
  isLoading: boolean;
  thinkingSteps: ThinkingStep[];
  onSend: (content: string) => Promise<boolean>;
  onAgain: (userContent: string) => void;
  robloxConnected: boolean;
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center ml-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="thinking-dot w-1.5 h-1.5 rounded-full bg-current inline-block" />
      ))}
    </span>
  );
}

function CodeBlock({ code, lang: codeLang, copyLabel, copiedLabel }: {
  code: string; lang: string; copyLabel: string; copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/10" style={{ background: '#1a1b26' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{codeLang}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-300 transition-colors">
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="code-block p-4 overflow-x-auto"><code>{code}</code></pre>
    </div>
  );
}

const STEP_ICONS: Record<string, string> = {
  'Thinking': '🧠', 'Checking Explorer': '🔍', 'Analyzing Code': '📖',
  'Reviewing Scripts': '📜', 'Processing Request': '⚙️',
  'Executing Command': '⚡', 'Writing Code': '✍️', 'Write Code': '✍️',
};

function ThinkingStepsDisplay({ steps }: { steps: ThinkingStep[] }) {
  if (steps.length === 0) return null;
  const latest = steps[steps.length - 1];
  return (
    <div className="flex gap-3 msg-in">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 overflow-hidden shadow-sm mt-0.5" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        <img src="/zenith-logo.png" alt="Z" className="w-full h-full object-cover" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {steps.slice(0, -1).map((step) => (
          <div key={step.id} className="flex items-center gap-2 mb-1.5 step-in">
            <span className="text-sm">{STEP_ICONS[step.label] ?? '•'}</span>
            <span className="text-[12px] text-gray-400 line-through">{step.label}</span>
            <Check size={11} className="text-green-400" />
          </div>
        ))}
        <div className="flex items-center gap-2 step-in">
          <span className="text-sm">{STEP_ICONS[latest.label] ?? '•'}</span>
          <span className="text-[13px] font-medium text-gray-700">{latest.label}</span>
          <ThinkingDots />
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ msg, lang, onAgain }: {
  msg: Message; lang: Lang; onAgain: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = msg.codeSnippet
      ? `${msg.content}\n\n\`\`\`${msg.codeLanguage ?? 'lua'}\n${msg.codeSnippet}\n\`\`\``
      : msg.content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex gap-3 msg-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-8 h-8 rounded-xl flex-shrink-0 overflow-hidden shadow-sm mt-0.5" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
        <img src="/zenith-logo.png" alt="Z" className="w-full h-full object-cover" />
      </div>
      <div className="max-w-[80%]">
        <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-[13.5px] text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          {msg.codeSnippet && (
            <CodeBlock
              code={msg.codeSnippet}
              lang={msg.codeLanguage ?? 'lua'}
              copyLabel={t(lang, 'copy')}
              copiedLabel={t(lang, 'copied')}
            />
          )}
        </div>

        {/* Hover actions */}
        <div
          className="flex items-center gap-1 mt-1.5 ml-1 transition-all duration-150"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(3px)', pointerEvents: hovered ? 'auto' : 'none' }}
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-black/6 transition-all"
          >
            {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
            {copied ? t(lang, 'copied') : t(lang, 'copy')}
          </button>
          <button
            onClick={onAgain}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-black/6 transition-all"
          >
            <RefreshCw size={11} />
            {t(lang, 'again')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({
  lang,
  sessionTitle,
  messages,
  isLoading,
  thinkingSteps,
  onSend,
  onAgain,
  robloxConnected,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const success = await onSend(trimmed);
    if (success) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const findPrecedingUserMsg = (assistantIdx: number): string => {
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Top bar */}
      <div
        className="flex items-center px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)' }}
      >
        <div>
          <h1 className="text-[14px] font-semibold text-gray-900">{sessionTitle}</h1>
          {!robloxConnected && (
            <p className="text-[11px] text-amber-500 font-medium mt-0.5">{t(lang, 'notConnectedWarning')}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && thinkingSteps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden mb-5 shadow-lg"
              style={{ border: '1.5px solid rgba(0,0,0,0.1)' }}
            >
              <img src="/zenith-logo.png" alt="Zenith" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">{t(lang, 'greeting')}</h2>
            <p className="text-[13px] text-gray-500 max-w-xs leading-relaxed">{t(lang, 'greetingSubtitle')}</p>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((msg, idx) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end msg-in">
                  <div
                    className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-[13.5px] leading-relaxed text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1c1c30 100%)' }}
                  >
                    {msg.content}
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  key={msg.id}
                  msg={msg}
                  lang={lang}
                  onAgain={() => {
                    const userMsg = findPrecedingUserMsg(idx);
                    if (userMsg) onAgain(userMsg);
                  }}
                />
              )
            )}
            <ThinkingStepsDisplay steps={thinkingSteps} />
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 glass rounded-2xl px-4 py-3 border border-black/8 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t(lang, 'inputPlaceholder')}
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed min-h-[22px] max-h-[160px] font-sans disabled:opacity-60"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 hover:opacity-80 active:scale-95"
              style={{ background: '#0f0f1a' }}
            >
              <Send size={14} color="white" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">{t(lang, 'inputHint')}</p>
        </div>
      </div>
    </div>
  );
}
