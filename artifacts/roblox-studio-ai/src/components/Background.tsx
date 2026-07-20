export default function Background() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0f2ff 0%, #f8f9ff 40%, #f0f4ff 100%)' }}
    >
      {/* Orb 1 – soft blue */}
      <div
        className="orb orb-1"
        style={{
          width: 500,
          height: 500,
          top: '-10%',
          left: '-5%',
          background: 'rgba(147, 197, 253, 0.45)',
        }}
      />
      {/* Orb 2 – soft purple */}
      <div
        className="orb orb-2"
        style={{
          width: 420,
          height: 420,
          top: '30%',
          right: '-8%',
          background: 'rgba(196, 181, 253, 0.4)',
        }}
      />
      {/* Orb 3 – soft indigo */}
      <div
        className="orb orb-3"
        style={{
          width: 380,
          height: 380,
          bottom: '-5%',
          left: '20%',
          background: 'rgba(165, 180, 252, 0.38)',
        }}
      />
      {/* Orb 4 – soft sky */}
      <div
        className="orb orb-4"
        style={{
          width: 300,
          height: 300,
          top: '55%',
          left: '5%',
          background: 'rgba(125, 211, 252, 0.32)',
        }}
      />
      {/* Orb 5 – soft rose */}
      <div
        className="orb orb-5"
        style={{
          width: 260,
          height: 260,
          top: '10%',
          right: '25%',
          background: 'rgba(251, 207, 232, 0.35)',
        }}
      />
    </div>
  );
}
