import { type Lang, t } from '@/lib/i18n';

interface ConnectModalProps {
  lang: Lang;
  onConnect: () => void;
  onLater: () => void;
}

export default function ConnectModal({ lang, onConnect, onLater }: ConnectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onLater} />
      <div
        className="relative glass rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/10 msg-in"
        style={{ border: '1px solid rgba(255,255,255,0.95)' }}
      >
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg"
            style={{ border: '1.5px solid rgba(0,0,0,0.1)' }}
          >
            <img src="/zenith-logo.png" alt="Zenith" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center mb-7">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-2">{t(lang, 'connectTitle')}</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">{t(lang, 'connectDesc')}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConnect}
            className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}
          >
            {t(lang, 'connectBtn')}
          </button>
          <button
            onClick={onLater}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-black/5 transition-all duration-200"
          >
            {t(lang, 'maybeLater')}
          </button>
        </div>
      </div>
    </div>
  );
}
