import { useEffect, useRef, useState } from 'react';

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
  sessionTitle: string;
  messages: Message[];
  isLoading: boolean;
  thinkingSteps: ThinkingStep[];
  onSend: (content: string) => void;
  robloxConnected: boolean;
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="thinking-dot w-1.5 h-1.5 rounded-full bg-current inline-block"
        />
      ))}
    </span>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/10" style={{ background: '#1a1b26' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{lang}</span>
        <button
          onClick={copy}
          className="text-[11px] font-medium text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="code-block p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end msg-in">
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-[13.5px] leading-relaxed text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1c1c30 100%)' }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 msg-in">
      {/* Zenith avatar */}
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5"
        style={{ background: '#0f0f1a' }}
      >
        <img src="/zenith-logo.png" alt="Z" className="w-5 h-5 object-contain" style={{ filter: 'invert(1)' }} />
      </div>
      <div className="max-w-[80%]">
        <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-[13.5px] text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          {msg.codeSnippet && (
            <CodeBlock code={msg.codeSnippet} lang={msg.codeLanguage ?? 'lua'} />
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

const STEP_ICONS: Record<string, string> = {
  'Thinking': '🧠',
  'Checking Explorer': '🔍',
  'Analyzing Code': '📖',
  'Reviewing Scripts': '📜',
  'Processing Request': '⚙️',
  'Executing Command': '⚡',
  'Writing Code': '✍️',
  'Write Code': '✍️',
};

function ThinkingStepsDisplay({ steps }: { steps: ThinkingStep[] }) {
  if (steps.length === 0) return null;
  const latest = steps[steps.length - 1];

  return (
    <div className="flex gap-3 msg-in">
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5"
        style={{ background: '#0f0f1a' }}
      >
        <img src="/zenith-logo.png" alt="Z" className="w-5 h-5 object-contain" style={{ filter: 'invert(1)' }} />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {/* Completed steps */}
        {steps.slice(0, -1).map((step) => (
          <div key={step.id} className="flex items-center gap-2 mb-1.5 step-in">
            <span className="text-sm">{STEP_ICONS[step.label] ?? '•'}</span>
            <span className="text-[12px] text-gray-400 line-through">{step.label}</span>
            <span className="text-[10px] text-green-400">✓</span>
          </div>
        ))}
        {/* Current step */}
        <div className="flex items-center gap-2 step-in">
          <span className="text-sm">{STEP_ICONS[latest.label] ?? '•'}</span>
          <span className="text-[13px] font-medium text-gray-700">
            {latest.label}
          </span>
          <ThinkingDots />
        </div>
      </div>
    </div>
  );
}

const EMPTY_SUGGESTIONS = [
  'Crea un sistema de monedas con leaderboard',
  'Haz que una parte se mueva con TweenService',
  'Genera un GUI de inventario básico',
  'Cómo usar DataStore para guardar datos',
  'Crea un sistema de equipos aleatorios',
];

export default function ChatArea({
  sessionTitle,
  messages,
  isLoading,
  thinkingSteps,
  onSend,
  robloxConnected,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend(trimmed);
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

  const isEmpty = messages.length === 0;

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
            <p className="text-[11px] text-amber-500 font-medium mt-0.5">⚠ Roblox no conectado — funcionalidad limitada</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty && thinkingSteps.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
              style={{ background: '#0f0f1a' }}
            >
              <img src="/zenith-logo.png" alt="Z" className="w-10 h-10 object-contain" style={{ filter: 'invert(1)' }} />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">Hola, soy Zenith</h2>
            <p className="text-[13px] text-gray-500 mb-8 max-w-xs leading-relaxed">
              Tu asistente de IA para Roblox Studio. Pregúntame cualquier cosa sobre Luau, mecánicas de juego o diseño.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {EMPTY_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-left px-4 py-3 rounded-xl glass text-[12.5px] text-gray-700 hover:bg-white/90 transition-all duration-150 hover:shadow-sm border border-black/6"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
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
              placeholder="Pregúntale algo a Zenith..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed min-h-[22px] max-h-[160px] font-sans"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 hover:opacity-80 active:scale-95"
              style={{ background: '#0f0f1a' }}
              title="Enviar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
