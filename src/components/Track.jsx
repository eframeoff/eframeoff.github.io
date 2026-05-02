import { useGame } from '../GameContext.jsx';

function StickHead({ player, isMe }) {
  return (
    <div style={{
      position: 'relative',
      width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
      border: `2.5px solid ${player.color}`,
      filter: isMe ? `drop-shadow(0 0 7px ${player.color})` : 'none',
      flexShrink: 0,
    }}>
      {player.photo
        ? <img src={player.photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : <div style={{
            width:'100%', height:'100%',
            background: player.color + '22',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.1rem', fontWeight:900, color:player.color,
          }}>
            {(player.name||'?')[0].toUpperCase()}
          </div>
      }
      {(player.streak||0) >= 2 && (
        <div style={{
          position:'absolute', top:-8, right:-8,
          fontSize:'.52rem', fontWeight:900,
          background:'rgba(0,0,0,.85)', borderRadius:4, padding:'1px 3px',
        }}>🔥{player.streak}</div>
      )}
    </div>
  );
}



export default function Track() {
  const { state, myId } = useGame();
  const entries = Object.entries(state.players);
  if (!entries.length) return (
    <div className="empty-state" style={{ padding:20 }}>Пока никого</div>
  );

  const count  = entries.length;
  const bandH  = 90;
  const fieldH = count * bandH + 16;

  // Vertical slots — sorted by score (leader at top)
  const byScore = [...entries].sort((a,b) => (b[1].steps||0) - (a[1].steps||0));
  const vertMap = {};
  byScore.forEach(([id], i) => {
    vertMap[id] = i * bandH + Math.round(bandH / 2) - 47;
  });

  const topS = Math.max(...entries.map(([,p]) => p.steps||0), 80);

  // Check who trained today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Layout constants — no start line, just positions
  const START_PX   = 50;
  const FINISH_PCT = 88;

  return (
    <div style={{
      position:'relative', height:fieldH,
      background:'rgba(0,0,0,.38)',
      borderRadius:16, border:'1px solid rgba(255,255,255,.05)',
      overflow:'hidden',
    }}>

      {/* ── FINISH — 🏁 emoji only ── */}
      <div style={{
        position:'absolute', right:10, top:'50%',
        transform:'translateY(-50%)',
        fontSize:'1.8rem', opacity:.65,
        zIndex:4, pointerEvents:'none',
      }}>🏁</div>
      <div style={{
        position:'absolute', right:10,
        top:'calc(50% - 32px)',
        fontSize:'.44rem', fontFamily:"'Press Start 2P',monospace",
        color:'rgba(255,255,255,.5)', letterSpacing:1,
        pointerEvents:'none', zIndex:4,
      }}>FINISH</div>

      {/* ── LANE HIGHLIGHTS top 3 ───────────── */}
      {byScore.slice(0, Math.min(3, count)).map(([id], rank) => {
        const colors = ['#FFB800','#C0C0C0','#CD7F32'];
        const bg     = ['rgba(255,184,0,.22)','rgba(192,192,192,.13)','rgba(205,127,50,.13)'];
        const labels = ['👑 1','🥈 2','🥉 3'];
        const c = colors[rank];
        return (
          <div key={`lane-${rank}`} style={{
            position:'absolute', left:0, right:0,
            top: rank * bandH, height: bandH,
            background: bg[rank],
            borderLeft: `3px solid ${c}`,
            pointerEvents:'none', zIndex:0,
          }}>
            <div style={{
              position:'absolute', left:6, top:'50%',
              transform:'translateY(-50%)',
              fontFamily:"'Press Start 2P',monospace",
              fontSize:'.32rem', color: c,
              opacity:.7, letterSpacing:1,
            }}>{labels[rank]}</div>
          </div>
        );
      })}

      {/* ── ROAD DASHES ──────────────────────── */}
      <div style={{
        position:'absolute',
        left: START_PX + 6,
        right: `${100 - FINISH_PCT}%`,
        bottom:22, height:1,
        background:'repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 10px,transparent 10px 20px)',
        pointerEvents:'none',
      }} />

      {/* ── STICKMEN ─────────────────────────── */}
      {entries.map(([id, p]) => {
        const steps  = p.steps || 0;
        const isMe   = id === myId;
        const topPx  = vertMap[id] ?? 0;
        const delay  = (Math.abs(id.charCodeAt(2)||0) % 40) / 100;

        // Position: 0 steps → START_PX. Any steps → proportional from START_PX onward
        let leftStyle;
        if (steps === 0) {
          leftStyle = `${START_PX}px`;
        } else {
          // Start from START_PX + small offset so even 1pt is visibly ahead of 0
          const pct = Math.min((steps / (topS * 1.08)) * (FINISH_PCT - 8), FINISH_PCT - 4);
          leftStyle = `calc(${pct.toFixed(1)}% + ${START_PX + 10}px)`;
        }

        // Opacity: dim only players who have 0 steps total (haven't done anything this week)
        const opacity = steps > 0 ? 1 : 0.38;

        return (
          <div key={id} id={`run-${id}`} style={{
            position:'absolute',
            left: leftStyle,
            top: topPx,
            color: p.color,
            display:'flex', flexDirection:'column', alignItems:'center',
            transform:'translateX(-50%)',
            transition:'left 1s cubic-bezier(.34,1.4,.64,1), opacity .4s ease',
            zIndex:3,
            opacity,
          }}>
            <StickHead player={p} isMe={isMe} />

            {/* Torso + arms */}
            <div style={{ width:3, height:18, background:p.color, position:'relative' }}>
              <div style={{
                position:'absolute', width:24, height:2.5,
                background:p.color, top:5, left:-11,
              }} />
            </div>

            {/* Legs */}
            <div style={{ display:'flex', gap:7 }}>
              {[0,1].map(leg => (
                <div key={leg} style={{
                  width:2.5, height:22, background:p.color,
                  borderRadius:'0 0 3px 3px', transformOrigin:'top center',
                  animation: `${leg===0?'legL':'legR'} .46s ease-in-out ${(leg===0?delay:delay+0.24)}s infinite alternate`,
                }} />
              ))}
            </div>

            {/* Name tag */}
            <div style={{
              fontFamily:"'Oswald', sans-serif",
              fontSize:'.65rem', fontWeight:700,
              background:'rgba(0,0,0,.72)', borderRadius:4,
              padding:'1px 6px', whiteSpace:'nowrap',
              textTransform:'uppercase', marginTop:2,
              maxWidth:78, overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {p.name}{isMe ? ' 👈' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
