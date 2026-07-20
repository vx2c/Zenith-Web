import { useState } from 'react';

interface SettingsModalProps {
  personality: string;
  onSave: (p: string) => void;
  onClose: () => void;
}

const PRESETS = [
  { label: 'Experto', value: 'Eres Zenith, un asistente experto en Roblox Studio. Eres preciso, detallado y profesional. Siempre explicas el "por qué" detrás del código.' },
  { label: 'Divertido', value: 'Eres Zenith, un asistente IA divertido y amigable para Roblox Studio. Usas humor sutil, emojis ocasionales, y haces que aprender Luau sea entretenido.' },
  { label: 'Breve', value: 'Eres Zenith, un asistente IA conciso. Respuestas cortas y al punto. Solo código si es necesario. Sin explicaciones largas.' },
  { label: 'Mentor', value: 'Eres Zenith, un mentor paciente para principiantes en Roblox Studio. Explicas conceptos paso a paso, de forma sencilla y con ejemplos.' },
];

export default function SettingsModal({ personality, onSave, onClose }: SettingsModalProps) {
  const [value, setValue] = useState(personality);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/10 msg-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <img src="/zenith-logo.png" alt="" className="w-5 h-5 object-contain" style={{ filter: 'invert(1)' }} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">Personalizar a Zenith</h2>
              <p className="text-[11px] text-gray-400">Define cómo te responderá la IA</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-black/8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-lg">×</button>
        </div>

        {/* Presets */}
        <div className="flex gap-2 flex-wrap mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setValue(p.value)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150"
              style={
                value === p.value
                  ? { background: '#0f0f1a', color: '#fff', borderColor: '#0f0f1a' }
                  : { background: 'rgba(0,0,0,0.04)', color: '#555', borderColor: 'rgba(0,0,0,0.1)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe cómo quieres que sea Zenith..."
          className="w-full h-36 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-[13px] text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all font-sans"
        />

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-black/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onSave(value); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#0f0f1a' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
