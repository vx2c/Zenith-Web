import { useState } from 'react';
import { X, Zap, Smile, AlignLeft, GraduationCap, Globe } from 'lucide-react';
import { type Lang, t } from '@/lib/i18n';

interface SettingsModalProps {
  lang: Lang;
  personality: string;
  language: Lang;
  onSave: (personality: string, lang: Lang) => void;
  onClose: () => void;
}

export default function SettingsModal({ lang, personality, language, onSave, onClose }: SettingsModalProps) {
  const [value, setValue] = useState(personality);
  const [selectedLang, setSelectedLang] = useState<Lang>(language);

  const PRESETS = [
    { labelKey: 'expert' as const, icon: Zap, promptKey: 'expertPrompt' as const },
    { labelKey: 'fun' as const, icon: Smile, promptKey: 'funPrompt' as const },
    { labelKey: 'brief' as const, icon: AlignLeft, promptKey: 'briefPrompt' as const },
    { labelKey: 'mentor' as const, icon: GraduationCap, promptKey: 'mentorPrompt' as const },
  ];

  const LANGUAGES = [
    { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/10 msg-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <img src="/zenith-logo.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">{t(lang, 'customizeTitle')}</h2>
              <p className="text-[11px] text-gray-400">{t(lang, 'customizeSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-black/8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Site language */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={12} className="text-gray-400" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              {t(lang, 'siteLanguage')}
            </span>
          </div>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-medium border transition-all duration-150 flex-1 justify-center"
                style={
                  selectedLang === l.code
                    ? { background: '#0f0f1a', color: '#fff', borderColor: '#0f0f1a' }
                    : { background: 'rgba(0,0,0,0.03)', color: '#555', borderColor: 'rgba(0,0,0,0.1)' }
                }
              >
                <span>{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-1 border-t border-black/8 mb-4" />

        {/* Personality */}
        <div className="mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {t(lang, 'personality')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const presetPrompt = t(lang, p.promptKey);
            const active = value === presetPrompt;
            return (
              <button
                key={p.labelKey}
                onClick={() => setValue(presetPrompt)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium border transition-all duration-150 text-left"
                style={
                  active
                    ? { background: '#0f0f1a', color: '#fff', borderColor: '#0f0f1a' }
                    : { background: 'rgba(0,0,0,0.03)', color: '#555', borderColor: 'rgba(0,0,0,0.1)' }
                }
              >
                <Icon size={13} />
                {t(lang, p.labelKey)}
              </button>
            );
          })}
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(lang, 'personalityPlaceholder')}
          className="w-full h-28 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-[13px] text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all font-sans"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-black/5 transition-colors"
          >
            {t(lang, 'cancel')}
          </button>
          <button
            onClick={() => { onSave(value, selectedLang); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#0f0f1a' }}
          >
            {t(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
}
