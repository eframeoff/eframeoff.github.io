import { useGame } from '../GameContext.jsx';
import { yesterdayStr } from '../utils.js';

function calcDayPts(d) {
  if (!d) return 0;
  return Math.round(
    (d.pullups||0)*4 + (d.pushups||0)*2 + (d.dips||0)*3 +
    (d.squats||0)    + (d.abs||0)*15    + (d.press||0)*0.3 +
    (d.run_km||0)*40 + (d.beer||0)*(-20) + (d.spirit||0)*(-30) + (d.wine||0)*10
  );
}

export default function DayChad() {
  const { state } = useGame();
  const yesterday = yesterdayStr();
  const dayData   = state.daily?.[yesterday] || {};

  // Find best player of yesterday
  let winner = null, maxPts = 0;
  Object.entries(dayData).forEach(([id, d]) => {
    const pts = calcDayPts(d);
    if (pts > maxPts) { maxPts = pts; winner = id; }
  });

  if (!winner || maxPts === 0) return null;

  const player = state.players?.[winner];
  if (!player) return null;

  const sz = 60;

  return (
    <div style={{
      background: 'linear-gradient(135deg,#0D1A00,#080E00)',
      border: '2px solid rgba(57,255,20,.35)',
      borderRadius: 18,
      padding: '14px 14px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      minWidth: 120,
      flex: '0 0 auto',
    }}>

      {/* Title */}
      <div style={{
        fontFamily: "'Press Start 2P',monospace",
        fontSize: '.38rem',
        color: '#39FF14',
        letterSpacing: 1.5,
        textAlign: 'center',
        lineHeight: 1.6,
      }}>⭐ ЧАД<br/>ДНЯ ⭐</div>

      {/* Avatar */}
      <div style={{
        width: sz, height: sz, borderRadius: '50%', overflow: 'hidden',
        border: '2px solid #39FF14',
        boxShadow: '0 0 14px rgba(57,255,20,.35)',
        flexShrink: 0,
      }}>
        {player.photo
          ? <img src={player.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{
              width: '100%', height: '100%',
              background: 'rgba(57,255,20,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: Math.round(sz * .4), fontWeight: 900, color: '#39FF14',
            }}>{(player.name || '?')[0].toUpperCase()}</div>
        }
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "'Oswald',sans-serif",
        fontWeight: 700,
        fontSize: '.82rem',
        textTransform: 'uppercase',
        letterSpacing: .5,
        color: 'var(--text)',
        textAlign: 'center',
        maxWidth: 100,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{player.name}</div>

      {/* Points */}
      <div style={{
        fontFamily: "'Press Start 2P',monospace",
        fontSize: '.48rem',
        color: '#39FF14',
      }}>{maxPts}</div>

      {/* Date label */}
      <div style={{
        fontSize: '.68rem',
        color: 'var(--dim)',
        fontFamily: "'Nunito',sans-serif",
      }}>{yesterday}</div>

    </div>
  );
}
