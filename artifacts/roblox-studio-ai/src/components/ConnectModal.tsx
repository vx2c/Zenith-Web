interface ConnectModalProps {
  onConnect: () => void;
  onLater: () => void;
}

export default function ConnectModal({ onConnect, onLater }: ConnectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onLater} />

      {/* Card */}
      <div
        className="relative glass rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/10 msg-in"
        style={{ border: '1px solid rgba(255,255,255,0.95)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-black/10 bg-white flex items-center justify-center">
            <img src="/zenith-logo.png" alt="Zenith" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-7">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-2">Conecta tu cuenta de Roblox</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Vincula tu cuenta para que Zenith pueda acceder a tu perfil y personalizar tu experiencia.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConnect}
            className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}
          >
            Conectar con Roblox
          </button>
          <button
            onClick={onLater}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-black/5 transition-all duration-200"
          >
            Quizás después
          </button>
        </div>
      </div>
    </div>
  );
}
