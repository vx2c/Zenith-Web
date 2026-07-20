import { useCallback, useEffect, useRef, useState } from 'react';
import Background from '@/components/Background';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import ConnectModal from '@/components/ConnectModal';
import SettingsModal from '@/components/SettingsModal';

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

// ── Thinking steps sequence ───────────────────────────────────────────────────

const THINKING_SEQUENCES: Record<string, string[]> = {
  default: ['Thinking', 'Processing Request', 'Writing Code'],
  explorer: ['Thinking', 'Checking Explorer', 'Executing Command', 'Write Code'],
  code: ['Thinking', 'Analyzing Code', 'Reviewing Scripts', 'Write Code'],
  data: ['Thinking', 'Processing Request', 'Write Code'],
};

function getSequence(text: string): string[] {
  const t = text.toLowerCase();
  if (t.includes('explorer') || t.includes('plugin') || t.includes('revisa')) return THINKING_SEQUENCES.explorer;
  if (t.includes('code') || t.includes('script') || t.includes('código') || t.includes('arregla')) return THINKING_SEQUENCES.code;
  if (t.includes('data') || t.includes('datos') || t.includes('datastore')) return THINKING_SEQUENCES.data;
  return THINKING_SEQUENCES.default;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API = '/api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Default personality ───────────────────────────────────────────────────────

const DEFAULT_PERSONALITY = 'Eres Zenith, un asistente experto en Roblox Studio y Luau. Eres preciso, útil y amigable.';

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Plugin connection (simulated — plugin connects via future WS)
  const [pluginConnected] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [personality, setPersonality] = useState<string>(() => {
    return localStorage.getItem('zenith_personality') ?? DEFAULT_PERSONALITY;
  });

  const stepIdRef = useRef(0);
  const thinkingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Fetch auth ──────────────────────────────────────────────────────────────

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user?: User }>('/auth/me')
      .then(({ authenticated, user: u }) => {
        if (authenticated && u) {
          setUser(u);
        } else {
          setShowConnectModal(true);
        }
      })
      .catch(() => setShowConnectModal(true))
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Fetch sessions ──────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch<Session[]>('/chat/sessions');
      setSessions(data);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Fetch messages for active session ────────────────────────────────────────

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    apiFetch<Message[]>(`/chat/sessions/${activeSessionId}/messages`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeSessionId]);

  // ── New chat ─────────────────────────────────────────────────────────────────

  const handleNewChat = useCallback(async () => {
    if (!user) {
      setShowConnectModal(true);
      return;
    }
    try {
      const session = await apiFetch<Session>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: 'Nuevo chat' }),
      });
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // ── Select session ────────────────────────────────────────────────────────────

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setThinkingSteps([]);
  }, []);

  // ── Delete session ────────────────────────────────────────────────────────────

  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      await apiFetch(`/chat/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  }, [activeSessionId]);

  // ── Send message ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(async (content: string) => {
    if (isLoading) return;

    // Ensure we have an active session
    let sessionId = activeSessionId;
    if (!sessionId) {
      if (!user) { setShowConnectModal(true); return; }
      try {
        const title = content.length > 40 ? content.slice(0, 40) + '…' : content;
        const session = await apiFetch<Session>('/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ title }),
        });
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch { return; }
    }

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content,
      codeSnippet: null,
      codeLanguage: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    // Start thinking animation
    const sequence = getSequence(content);
    thinkingTimersRef.current.forEach(clearTimeout);
    thinkingTimersRef.current = [];
    setThinkingSteps([]);

    sequence.forEach((label, i) => {
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

      // Replace temp message + add AI response
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        // Add real user message (comes back implicitly from history on next load)
        return [...withoutTemp, {
          ...tempUserMsg,
          id: `user-${Date.now()}`,
        }, aiMsg];
      });

      // Update session title if it was auto-generated
      const shortened = content.length > 40 ? content.slice(0, 40) + '…' : content;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId && s.title === 'Nuevo chat'
            ? { ...s, title: shortened, messageCount: s.messageCount + 2 }
            : { ...s, messageCount: s.id === sessionId ? s.messageCount + 2 : s.messageCount }
        )
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      thinkingTimersRef.current.forEach(clearTimeout);
      setThinkingSteps([]);
      setIsLoading(false);
    }
  }, [activeSessionId, isLoading, personality, user]);

  // ── Settings ──────────────────────────────────────────────────────────────────

  const handleSavePersonality = useCallback((p: string) => {
    setPersonality(p);
    localStorage.setItem('zenith_personality', p);
  }, []);

  // ── Active session title ──────────────────────────────────────────────────────

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = activeSession?.title ?? 'Zenith';

  // ── Render ────────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Background />
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: '#0f0f1a' }}
          >
            <img src="/zenith-logo.png" alt="Z" className="w-9 h-9 object-contain" style={{ filter: 'invert(1)' }} />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="thinking-dot w-2 h-2 rounded-full bg-gray-400"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Background />

      {/* Sidebar */}
      <Sidebar
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

      {/* Chat */}
      <ChatArea
        sessionTitle={sessionTitle}
        messages={messages}
        isLoading={isLoading}
        thinkingSteps={thinkingSteps}
        onSend={handleSend}
        robloxConnected={!!user}
      />

      {/* Modals */}
      {showConnectModal && (
        <ConnectModal
          onConnect={() => { window.location.href = '/api/auth/roblox'; }}
          onLater={() => setShowConnectModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          personality={personality}
          onSave={handleSavePersonality}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
