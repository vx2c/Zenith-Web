import { useCallback, useEffect, useRef, useState } from 'react';
import Background from '@/components/Background';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import ConnectModal from '@/components/ConnectModal';
import SettingsModal from '@/components/SettingsModal';
import { type Lang } from '@/lib/i18n';

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  robloxId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

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

// ── Thinking sequences ────────────────────────────────────────────────────────

const THINKING_SEQUENCES: Record<string, string[]> = {
  default: ['Thinking', 'Processing Request', 'Writing Code'],
  explorer: ['Thinking', 'Checking Explorer', 'Executing Command', 'Write Code'],
  code: ['Thinking', 'Analyzing Code', 'Reviewing Scripts', 'Write Code'],
};

function getSequence(text: string): string[] {
  const t = text.toLowerCase();
  if (t.includes('explorer') || t.includes('plugin') || t.includes('revisa')) return THINKING_SEQUENCES.explorer;
  if (t.includes('script') || t.includes('código') || t.includes('arregla') || t.includes('code')) return THINKING_SEQUENCES.code;
  return THINKING_SEQUENCES.default;
}

// ── API ───────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PERSONALITY = 'Eres Zenith, un asistente experto en Roblox Studio y Luau. Eres preciso, útil y amigable.';

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [pluginConnected] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [personality, setPersonality] = useState<string>(() =>
    localStorage.getItem('zenith_personality') ?? DEFAULT_PERSONALITY
  );
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('zenith_lang') as Lang) ?? 'es'
  );

  const stepIdRef = useRef(0);
  const thinkingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user?: User }>('/auth/me')
      .then(({ authenticated, user: u }) => {
        if (authenticated && u) setUser(u);
        else setShowConnectModal(true);
      })
      .catch(() => setShowConnectModal(true))
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Sessions ────────────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch<Session[]>('/chat/sessions');
      setSessions(data);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Messages ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    apiFetch<Message[]>(`/chat/sessions/${activeSessionId}/messages`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeSessionId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNewChat = useCallback(async () => {
    if (!user) { setShowConnectModal(true); return; }
    try {
      const session = await apiFetch<Session>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: lang === 'en' ? 'New chat' : 'Nuevo chat' }),
      });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (e) { console.error(e); }
  }, [user, lang]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setThinkingSteps([]);
  }, []);

  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      await apiFetch(`/chat/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) { setActiveSessionId(null); setMessages([]); }
    } catch { /* ignore */ }
  }, [activeSessionId]);

  /** Returns true on success so ChatArea can clear the input */
  const handleSend = useCallback(async (content: string): Promise<boolean> => {
    if (isLoading) return false;

    let sessionId = activeSessionId;
    if (!sessionId) {
      if (!user) { setShowConnectModal(true); return false; }
      try {
        const title = content.length > 40 ? content.slice(0, 40) + '…' : content;
        const session = await apiFetch<Session>('/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ title }),
        });
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch { return false; }
    }

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = { id: tempId, role: 'user', content, codeSnippet: null, codeLanguage: null, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    setIsLoading(true);

    // Thinking animation
    thinkingTimersRef.current.forEach(clearTimeout);
    thinkingTimersRef.current = [];
    setThinkingSteps([]);
    getSequence(content).forEach((label, i) => {
      const timer = setTimeout(() => {
        const id = ++stepIdRef.current;
        setThinkingSteps((prev) => [...prev, { id, label }]);
      }, i * 700);
      thinkingTimersRef.current.push(timer);
    });

    try {
      const aiMsg = await apiFetch<Message>(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, personality }),
      });

      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return [...without, { ...tempMsg, id: `user-${Date.now()}` }, aiMsg];
      });

      const shortened = content.length > 40 ? content.slice(0, 40) + '…' : content;
      const defaultTitle = lang === 'en' ? 'New chat' : 'Nuevo chat';
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId && s.title === defaultTitle
            ? { ...s, title: shortened, messageCount: s.messageCount + 2 }
            : s.id === sessionId
            ? { ...s, messageCount: s.messageCount + 2 }
            : s
        )
      );
      return true;
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    } finally {
      thinkingTimersRef.current.forEach(clearTimeout);
      setThinkingSteps([]);
      setIsLoading(false);
    }
  }, [activeSessionId, isLoading, personality, user, lang]);

  const handleAgain = useCallback((userContent: string) => {
    handleSend(userContent);
  }, [handleSend]);

  const handleSaveSettings = useCallback((p: string, l: Lang) => {
    setPersonality(p);
    setLang(l);
    localStorage.setItem('zenith_personality', p);
    localStorage.setItem('zenith_lang', l);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = activeSession?.title ?? 'Zenith';

  // ── Loading screen ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Background />
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl"
            style={{ border: '1.5px solid rgba(0,0,0,0.1)' }}
          >
            <img src="/zenith-logo.png" alt="Zenith" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="thinking-dot w-2 h-2 rounded-full bg-gray-400" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Background />

      <Sidebar
        lang={lang}
        user={user}
        pluginConnected={pluginConnected}
        robloxConnected={!!user}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setShowSettings(true)}
        onConnectRoblox={() => setShowConnectModal(true)}
      />

      <ChatArea
        lang={lang}
        sessionTitle={sessionTitle}
        messages={messages}
        isLoading={isLoading}
        thinkingSteps={thinkingSteps}
        onSend={handleSend}
        onAgain={handleAgain}
        robloxConnected={!!user}
      />

      {showConnectModal && (
        <ConnectModal
          lang={lang}
          onConnect={() => { window.location.href = '/api/auth/roblox'; }}
          onLater={() => setShowConnectModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          lang={lang}
          personality={personality}
          language={lang}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
