import { useState } from 'react';

// Big tap-friendly PIN pad for mobile
export default function PinModal({ playerName, playerColor, onSuccess, onClose, shake = false }) {
  const [pin, setPin] = useState('');

  function tap(digit) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => { onSuccess(next); setPin(''); }, 120);
    }
  }

  function del() { setPin(p => p.slice(0, -1)); }
  const digits = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:700,
        background:'rgba(0,0,0,.88)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--surf)',
          border:`1px solid ${playerColor}`,
          borderRadius:22,
          padding:'28px 24px 24px',
          width:'100%', maxWidth:320,
          textAlign:'center',
          boxShadow:`0 0 40px ${playerColor}33`,
          animation: shake ? 'pinShake .4s ease' : 'mPop .28s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <style>{`
          @keyframes pinShake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-8px)}
            80%{transform:translateX(8px)}
          }
        `}</style>

        {/* Player name */}
        <div style={{
          fontFamily:"'Oswald',sans-serif", fontSize:'1.1rem', fontWeight:700,
          textTransform:'uppercase', color: playerColor, marginBottom:4,
        }}>
          {playerName}
        </div>
        <div style={{
          fontFamily:"'Oswald',sans-serif", fontSize:'.72rem', fontWeight:700,
          color:'var(--dim)', marginBottom:22, textTransform:'uppercase', letterSpacing:1,
        }}>
          Введи PIN-код
        </div>

        {/* Dots */}
        <div style={{
          display:'flex', justifyContent:'center', gap:14, marginBottom:28,
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:16, height:16, borderRadius:'50%',
              background: i < pin.length ? playerColor : 'var(--surf2)',
              border:`2px solid ${i < pin.length ? playerColor : 'rgba(255,255,255,.12)'}`,
              transition:'all .15s',
              boxShadow: i < pin.length ? `0 0 8px ${playerColor}88` : 'none',
            }} />
          ))}
        </div>

        {/* PIN pad */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10,
        }}>
          {digits.map((d, i) => {
            if (d === null) return <div key={i} />;
            const isDel = d === '⌫';
            return (
              <button
                key={i}
                onClick={() => isDel ? del() : tap(String(d))}
                style={{
                  height:62,
                  borderRadius:14,
                  border: isDel ? '1px solid rgba(255,45,45,.25)' : '1px solid var(--border)',
                  background: isDel ? 'rgba(255,45,45,.08)' : 'var(--surf2)',
                  color: isDel ? 'var(--red)' : 'var(--text)',
                  fontSize: isDel ? '1.4rem' : '1.5rem',
                  fontWeight:700,
                  fontFamily:"'Nunito',sans-serif",
                  cursor:'pointer',
                  transition:'transform .08s, background .1s',
                  WebkitTapHighlightColor:'transparent',
                  touchAction:'manipulation',
                }}
                onPointerDown={e => e.currentTarget.style.transform='scale(.92)'}
                onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
                onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}
              >
                {d}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop:16, background:'none', border:'none',
            color:'var(--dim)', fontFamily:"'Nunito',sans-serif",
            fontSize:'.85rem', fontWeight:700, cursor:'pointer',
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
