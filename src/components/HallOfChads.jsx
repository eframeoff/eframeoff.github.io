import { useGame } from '../GameContext.jsx';

function Confetti() {
  const pieces = Array.from({ length: 12 }, (_, i) => ({
    left: `${5 + (i * 7.5) % 90}%`,
    delay: `${(i * 0.22) % 2}s`,
    dur: `${2.2 + (i % 4) * 0.35}s`,
    color: ['#FFB800','#FF5E5B','#39FF14','#00CFFF','#FF69B4','#FFD700'][i % 6],
    size: 5 + (i % 4) * 3,
  }));
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      <style>{`
        @keyframes cFall{0%{transform:translateY(-16px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(540deg);opacity:0}}
        @keyframes hallPulse{0%,100%{box-shadow:0 0 18px rgba(255,184,0,.22)}50%{box-shadow:0 0 36px rgba(255,184,0,.45)}}
      `}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position:'absolute', left:p.left, top:-10,
          width:p.size, height:p.size, background:p.color,
          borderRadius: i%3===0?'50%':'2px',
          animation:`cFall ${p.dur} ${p.delay} ease-in infinite`, opacity:.85,
        }}/>
      ))}
    </div>
  );
}

export default function HallOfChads() {
  const { state } = useGame();
  const winner = state.lastWinner;
  const history = Object.values(state.hallOfFame || {})
    .sort((a,b) => (b.ts||0)-(a.ts||0)).slice(0, 10);

  // Show only if there's a past winner
  if (!winner && history.length === 0) return null;

  // Top 3 from hall of fame (sorted by steps desc within same week, then by recency)
  const pastTop = history.slice(0, 3);
  if (pastTop.length === 0) return null;

  const [showEntry, second, third] = pastTop;

  function PlayerCard({ entry, rank }) {
    if (!entry) return null;
    const rankIcons = { 1:'👑', 2:'🥈', 3:'🥉' };
    const sizes     = { 1: 72, 2: 56, 3: 56 };
    const sz = sizes[rank] || 56;
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        gap:6, flex:1,
      }}>
        <div style={{ fontSize:'1.4rem' }}>{rankIcons[rank]}</div>
        <div style={{
          width:sz, height:sz, borderRadius:'50%', overflow:'hidden',
          border:`3px solid ${rank===1?'#FFB800':rank===2?'#C0C0C0':'#CD7F32'}`,
          boxShadow:`0 0 14px ${rank===1?'rgba(255,184,0,.5)':'rgba(255,255,255,.15)'}`,
          flexShrink:0,
        }}>
          {entry.photo
            ? <img src={entry.photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{
                width:'100%', height:'100%',
                background:'rgba(255,184,0,.15)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:Math.round(sz*.4), fontWeight:900, color:'#FFB800',
              }}>{(entry.name||'?')[0].toUpperCase()}</div>
          }
        </div>
        <div style={{
          fontFamily:"'Oswald',sans-serif", fontWeight:700,
          fontSize: rank===1 ? '.9rem' : '.78rem',
          textTransform:'uppercase', letterSpacing:.5,
          color:'var(--text)', textAlign:'center',
          maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{entry.name}</div>
        <div style={{
          fontFamily:"'Press Start 2P',monospace",
          fontSize:'.52rem',
          color: rank===1?'#FFB800':rank===2?'#C0C0C0':'#CD7F32',
        }}>{entry.steps}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{
        position:'relative',
        background:'linear-gradient(135deg,#1A1200,#0E0A00)',
        border:'2px solid var(--gold)',
        borderRadius:18, padding:'18px 16px 20px',
        overflow:'hidden',
        animation:'hallPulse 3s ease infinite',
      }}>
        <Confetti />
        <div style={{ position:'relative', zIndex:1 }}>

          {/* Title */}
          <div style={{
            fontFamily:"'Press Start 2P',monospace",
            fontSize:'.48rem', color:'var(--gold)',
            letterSpacing:2, textAlign:'center', marginBottom:18,
          }}>⚡ ЗАЛ ЧАДОВ ПРОШЕДШЕЙ НЕДЕЛИ ⚡</div>

          {/* Players row */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', alignItems:'flex-start' }}>
            <PlayerCard entry={showEntry} rank={1} />
            {second && <PlayerCard entry={second} rank={2} />}
            {third  && <PlayerCard entry={third}  rank={3} />}
          </div>

        </div>
      </div>
    </div>
  );
}
