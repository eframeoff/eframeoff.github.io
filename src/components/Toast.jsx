export default function Toast({ msg, err, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 26, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
      background: 'var(--surf)',
      border: `1px solid ${err ? 'var(--red)' : 'var(--gold)'}`,
      borderRadius: 11, padding: '11px 20px',
      fontSize: '.88rem', fontWeight: 800,
      color: err ? 'var(--red)' : 'var(--gold)',
      boxShadow: `0 0 24px ${err ? 'rgba(255,45,45,.2)' : 'var(--gold-dim)'}`,
      opacity: visible ? 1 : 0,
      transition: 'all .28s',
      zIndex: 1000, pointerEvents: 'none',
      maxWidth: '90vw', textAlign: 'center',
      fontFamily: "'Oswald', sans-serif", letterSpacing: '.5px',
    }}>
      {msg}
    </div>
  );
}
