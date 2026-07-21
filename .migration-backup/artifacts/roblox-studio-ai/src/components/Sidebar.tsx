import { useState } from 'react';
import { SquarePen, Settings2, Trash2, Puzzle, Radio, Link2 } from 'lucide-react';
import { type Lang, t } from '@/lib/i18n';

interface Session {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

interface User {
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface SidebarProps {
  lang: Lang;
  user: User | null;
  pluginConnected: boolean;
  robloxConnected: boolean;
  sessions: Session[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  onConnectRoblox: () => void;
}

function StatusRow({ label, connected, icon: Icon }: { label: string; connected: boolean; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/4 transition-colors">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-gray-400" />
        <span className="text-[12px] font-medium text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 status-on' : 'bg-amber-400'}`} />
        <span className={`text-[11px] font-semibold ${connected ? 'text-green-600' : 'text-amber-500'}`}>
          {connected ? 'On' : 'Wait'}
        </span>
      </div>
    </div>
  );
}

export default function Sidebar({
  lang,
  user,
  pluginConnected,
  robloxConnected,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
  onConnectRoblox,
}: SidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  return (
    <div
      className="flex flex-col h-full w-[248px] flex-shrink-0 glass-dark"
      style={{ borderRight: '1px solid rgba(220,225,235,0.7)' }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
          style={{ border: '1.5px solid rgba(0,0,0,0.1)' }}
        >
          <img src="/zenith-logo.png" alt="Zenith" className="w-full h-full object-cover" />
        </div>
        <span className="text-[15px] font-bold text-gray-900 tracking-tight">Zenith</span>
      </div>

      {/* Status */}
      <div className="px-3 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-2 mb-1.5">
          {t(lang, 'status')}
        </p>
        <StatusRow label={t(lang, 'plugin')} connected={pluginConnected} icon={Puzzle} />
        <StatusRow label={t(lang, 'robloxConnect')} connected={robloxConnected} icon={Radio} />
      </div>

      <div className="mx-4 border-t border-black/8 mb-3" />

      {/* New Chat */}
      <div className="px-3 mb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1c1c30 100%)' }}
        >
          <SquarePen size={13} />
          {t(lang, 'newChat')}
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {sessions.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-2 mb-1.5">
              {t(lang, 'history')}
            </p>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="relative group"
                onMouseEnter={() => setHoveredSession(s.id)}
                onMouseLeave={() => setHoveredSession(null)}
              >
                <button
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-150 ${
                    activeSessionId === s.id
                      ? 'bg-black/10 text-gray-900'
                      : 'text-gray-600 hover:bg-black/5 hover:text-gray-800'
                  }`}
                >
                  <span className="block truncate pr-6">{s.title}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    {s.messageCount} {s.messageCount !== 1 ? t(lang, 'messages') : t(lang, 'message')}
                  </span>
                </button>
                {hoveredSession === s.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <div className="mx-1 border-t border-black/8 mb-3" />

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium text-gray-600 hover:bg-black/5 hover:text-gray-800 transition-colors"
        >
          <Settings2 size={15} />
          {t(lang, 'aiSettings')}
        </button>

        {user ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-bold text-gray-500">
                {user.displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-gray-900 truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{t(lang, 'robloxConnected')}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={onConnectRoblox}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium text-gray-500 hover:bg-black/5 transition-colors border border-dashed border-black/15"
          >
            <Link2 size={14} />
            {t(lang, 'connectRoblox')}
          </button>
        )}
      </div>
    </div>
  );
}
