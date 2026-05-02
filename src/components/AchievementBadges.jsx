import { useState } from 'react';
import { ACHIEVEMENT_MAP } from '../achievements.js';

export default function AchievementBadges({ achievements = {}, size = 28 }) {
  const [tooltip, setTooltip] = useState(null);

  const ids = Object.keys(achievements).sort(
    (a, b) => (achievements[a] || 0) - (achievements[b] || 0)
  );

  if (ids.length === 0) return null;

  const shown = tooltip ? ACHIEVEMENT_MAP[tooltip] : null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
        {ids.map(id => {
          const a = ACHIEVEMENT_MAP[id];
          if (!a) return null;
          const isActive = tooltip === id;
          return (
            <button key={id}
              onClick={e => { e.stopPropagation(); setTooltip(isActive ? null : id); }}
              style={{
                width:size, height:size, borderRadius:8,
                background: isActive ? 'rgba(255,184,0,.25)' : 'rgba(255,255,255,.07)',
                border: `1px solid ${isActive ? 'rgba(255,184,0,.5)' : 'rgba(255,255,255,.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: size * 0.55, cursor:'pointer', transition:'all .15s',
                padding:0, WebkitTapHighlightColor:'transparent',
              }}
            >{a.icon}</button>
          );
        })}
      </div>

      {shown && (
        <div onClick={() => setTooltip(null)} style={{
          position:'absolute', bottom:'100%', left:0, marginBottom:6, zIndex:100,
          background:'var(--surf)', border:'1px solid rgba(255,184,0,.4)',
          borderRadius:10, padding:'10px 13px', minWidth:180, maxWidth:240,
          boxShadow:'0 4px 20px rgba(0,0,0,.5)',
          animation:'mPop .2s cubic-bezier(.34,1.56,.64,1)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
            <span style={{ fontSize:'1.2rem' }}>{shown.icon}</span>
            <span style={{
              fontFamily:"'Oswald',sans-serif", fontWeight:700,
              fontSize:'.85rem', color:'var(--gold)',
              textTransform:'uppercase', letterSpacing:.5,
            }}>{shown.name}</span>
          </div>
          <div style={{ fontSize:'.75rem', color:'var(--dim)', fontWeight:700, lineHeight:1.4 }}>
            {shown.desc}
          </div>
          <div style={{ fontSize:'.6rem', color:'rgba(255,255,255,.2)', marginTop:6 }}>
            Получено: {new Date(achievements[tooltip]).toLocaleDateString('ru')}
          </div>
        </div>
      )}
    </div>
  );
}
