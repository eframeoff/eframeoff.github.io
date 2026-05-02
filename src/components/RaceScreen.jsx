import { useState } from 'react';
import { useGame } from '../GameContext.jsx';
import { daysUntilSummer, untilMonday, todayStr, isOnline, timeAgo, isoWeek } from '../utils.js';
import Avatar from './Avatar.jsx';
import Track from './Track.jsx';
import ExercisePanel from './ExercisePanel.jsx';
import Chat from './Chat.jsx';
import HallOfChads from './HallOfChads.jsx';
import DayChad from './DayChad.jsx';
import WeightChart, { WeightModal } from './WeightTracker.jsx';
import AchievementBadges from './AchievementBadges.jsx';
import TeamBattle from './TeamBattle.jsx';

function Collapsible({ id, title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="collapsible-wrap">
      <button className={`collapsible-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={`toggle-arrow${open ? ' open' : ''}`}>▼</span>
      </button>
      {open && <div className="collapsible-body open">{children}</div>}
    </div>
  );
}

function TodayStats({ state, myId }) {
  const today = todayStr();
  const sorted = Object.entries(state.players).sort((a, b) => (b[1].steps || 0) - (a[1].steps || 0));
  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      <table className="stats-table" style={{ minWidth:560 }}>
        <thead>
          <tr>
            <th>Игрок</th>
            <th>🏋️</th><th>💪</th><th>🤸</th><th>🦵</th><th>🧱</th><th>🔥</th><th>🏃км</th>
            <th>🍺</th><th>🥃</th><th>🍷</th>
            <th>Очки</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([id, p]) => {
            const d      = state.daily?.[today]?.[id] || {};
            const pull   = d.pullups||0, push = d.pushups||0, dips = d.dips||0;
            const sq     = d.squats||0,  abs  = d.abs||0,     press = d.press||0, run = d.run_km||0;
            const beer   = d.beer||0,    spirit = d.spirit||0, wine = d.wine||0;
            const pts    = Math.round(pull*4+push*2+dips*3+sq+abs*15+press*0.3+run*40+beer*(-20)+spirit*(-30)+wine*10);
            const isMe   = id === myId;
            const c      = (v) => <span style={{ color:v?p.color:'var(--dim)', fontWeight:v?900:400 }}>{v||'—'}</span>;
            const cBad   = (v) => <span style={{ color:v?'var(--red)':'var(--dim)', fontWeight:v?900:400 }}>{v||'—'}</span>;
            const cWine  = (v) => <span style={{ color:v?'#39FF14':'var(--dim)', fontWeight:v?900:400 }}>{v||'—'}</span>;
            return (
              <tr key={id} style={{ background:isMe?'rgba(255,184,0,.04)':'transparent' }}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <Avatar player={p} size={26} />
                    <span style={{ color:p.color, fontFamily:"'Oswald'", fontWeight:700, fontSize:'.78rem', textTransform:'uppercase' }}>
                      {p.name}{isMe?' 👈':''}
                    </span>
                  </div>
                </td>
                <td>{c(pull)}</td><td>{c(push)}</td><td>{c(dips)}</td>
                <td>{c(sq)}</td><td>{c(abs)}</td><td>{c(press)}</td><td>{c(run)}</td>
                <td>{cBad(beer)}</td><td>{cBad(spirit)}</td><td>{cWine(wine)}</td>
                <td><span style={{ fontWeight:900, color:pts?p.color:'var(--dim)', fontFamily:"'Oswald'" }}>{pts||'—'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}



function ExerciseTooltip({ state, playerId, color, onClose }) {
  const [tab, setTab] = useState('week');
  const currentWeek = state.currentWeek;

  function calcTotals(weekOnly) {
    const t = { pullups:0, pushups:0, dips:0, squats:0, abs:0, press:0, run_km:0, beer:0, spirit:0, wine:0 };
    Object.entries(state.daily || {}).forEach(([dateStr, dayData]) => {
      if (weekOnly && isoWeek(new Date(dateStr)) !== currentWeek) return;
      const d = dayData[playerId];
      if (!d) return;
      Object.keys(t).forEach(k => { t[k] += d[k] || 0; });
    });
    return t;
  }

  const totals = calcTotals(tab === 'week');
  const totalPts = Math.round(
    totals.pullups*4 + totals.pushups*2 + totals.dips*3 +
    totals.squats*1  + totals.abs*15   + totals.press*0.3 + totals.run_km*40 +
    totals.beer*(-20) + totals.spirit*(-30) + totals.wine*10
  );

  const rows = [
    { icon:'🏋️', label:'Подтягивания', val:totals.pullups, pts:totals.pullups*4    },
    { icon:'💪',  label:'Отжимания',    val:totals.pushups, pts:totals.pushups*2    },
    { icon:'🤸',  label:'Брусья',       val:totals.dips,    pts:totals.dips*3       },
    { icon:'🦵',  label:'Приседания',   val:totals.squats,  pts:totals.squats       },
    { icon:'🧱',  label:'Планка (мин)', val:totals.abs,     pts:totals.abs*15       },
    { icon:'🔥',  label:'Пресс (×10)',  val:totals.press,   pts:totals.press*0.3    },
    { icon:'🏃',  label:'Бег (км)',     val:totals.run_km,  pts:totals.run_km*40    },
    { icon:'🍺',  label:'Пиво',         val:totals.beer,    pts:totals.beer*(-20)   },
    { icon:'🥃',  label:'Крепкое',      val:totals.spirit,  pts:totals.spirit*(-30) },
    { icon:'🍷',  label:'Вино',         val:totals.wine,    pts:totals.wine*10      },
  ].filter(r => r.val > 0);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:800,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,.75)', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--surf)', border:`1px solid ${color}`,
        borderRadius:16, padding:'22px 24px', width:'100%', maxWidth:300,
        boxShadow:`0 0 30px ${color}33`,
        animation:'mPop .25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {[['week','За неделю'], ['all','За всё время']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex:1, padding:'7px 0', borderRadius:8, border:'none',
              background: tab === key ? color : 'var(--surf2)',
              color: tab === key ? '#000' : 'var(--dim)',
              fontFamily:"'Oswald',sans-serif",
              fontSize:'.75rem', fontWeight:700, cursor:'pointer', transition:'all .15s',
            }}>{label}</button>
          ))}
        </div>

        {rows.length === 0
          ? <div style={{ color:'var(--dim)', fontSize:'.85rem', textAlign:'center', padding:'10px 0' }}>Нет данных</div>
          : rows.map(({ icon, label, val, pts }) => (
            <div key={label} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'8px 0', borderBottom:'1px solid var(--border)',
            }}>
              <span style={{ fontSize:'.88rem' }}>{icon} {label}</span>
              <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700 }}>
                <span style={{ color:'var(--text)', fontSize:'1rem' }}>{val}</span>
                <span style={{ color:'var(--dim)', fontSize:'.75rem', marginLeft:6 }}>
                  = {Math.round(pts)} оч.
                </span>
              </span>
            </div>
          ))
        }

        <div style={{
          display:'flex', justifyContent:'space-between',
          marginTop:12, fontFamily:"'Oswald',sans-serif", fontWeight:700,
        }}>
          <span style={{ color:'var(--dim)' }}>Итого</span>
          <span style={{ color, fontSize:'1.1rem' }}>{totalPts} очков</span>
        </div>
        <button onClick={onClose} style={{
          marginTop:16, width:'100%', padding:9,
          background:'var(--surf2)', border:'1px solid var(--border)',
          borderRadius:9, color:'var(--dim)', fontFamily:"'Oswald',sans-serif",
          fontSize:'.85rem', fontWeight:700, cursor:'pointer',
        }}>Закрыть</button>
      </div>
    </div>
  );
}

function Leaderboard({ state, myId }) {
  const [tooltip, setTooltip] = useState(null); // playerId
  const sorted = Object.entries(state.players).sort((a, b) => (b[1].steps || 0) - (a[1].steps || 0));
  const maxS = Math.max(...sorted.map(([, p]) => p.steps || 0), 1);
  const rankEmoji = ['👑', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <>
      {sorted.map(([id, p], i) => {
        const s = p.steps || 0, streak = p.streak || 0;
        return (
          <div key={id} className="lb-row">
            <div className="lb-rank">{rankEmoji[i] || `#${i + 1}`}</div>
            <Avatar player={p} size={44} />
            <div className="lb-info">
              <div className={`lb-name${id === myId ? ' me' : ''}`} style={{ color: p.color }}>{p.name}</div>
              {p.status && <div className="lb-status-text">«{p.status}»</div>}
              <AchievementBadges achievements={p.achievements || {}} size={22} />
              <div className="lb-meta">
                {streak >= 2 && <span className="streak-badge" style={{ fontSize: '.65rem', padding: '2px 6px' }}>🔥 тренит {streak} дн.</span>}
                {isOnline(p.lastSeen) && <div className="online-dot" style={{ width: 7, height: 7 }} />}
              </div>
            </div>
            <div className="lb-bar-wrap">
              <div className="lb-bar" style={{ width: `${(s / maxS * 100).toFixed(1)}%`, background: p.color }} />
            </div>
            {/* Clickable points — shows breakdown */}
            <div
              className="lb-pts"
              onClick={() => setTooltip(id)}
              style={{
                color: p.color, cursor: 'pointer',
                borderBottom: `1px dashed ${p.color}66`,
                transition: 'opacity .15s',
              }}
              title="Нажми для детализации"
            >
              {s}
            </div>
          </div>
        );
      })}

      {tooltip && (
        <ExerciseTooltip
          state={state}
          playerId={tooltip}
          color={state.players[tooltip]?.color || 'var(--gold)'}
          onClose={() => setTooltip(null)}
        />
      )}
    </>
  );
}

function ShameBoard({ state }) {
  const lazy = Object.entries(state.players).filter(([, p]) => {
    const last = p.lastActiveDate || '';
    if (!last) return true;
    const diff = Math.floor((Date.now() - new Date(last)) / 86400000);
    return diff >= 2;
  });
  if (!lazy.length) return null;

  return (
    <div className="shame-box" style={{ marginBottom: 14 }}>
      <div className="shame-title">🥔 Не тренировались больше 2 дней</div>
      {lazy.map(([id, p]) => (
        <div key={id} className="shame-row">
          <Avatar player={p} size={34} />
          <div className="shame-row-name" style={{ color: p.color }}>{p.name}</div>
          <div className="shame-row-days">{timeAgo(p.lastSeen) || 'давно не заходил'}</div>
        </div>
      ))}
    </div>
  );
}

export default function RaceScreen({ onBack, showToast, onEvent, onMilestone, onOpenProfile, onNewAchievements }) {
  const { state, myId } = useGame();
  const [showWeight, setShowWeight] = useState(false);
  const me = state.players[myId];
  if (!me) { onBack(); return null; }


  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '14px 16px 80px' }}>

      {/* Header */}
      <div className="race-header">
        <div className="my-block">
          <div onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
            <Avatar player={me} size={54} style={{ border: '2px solid var(--gold)' }} />
          </div>
          <div>
            <div className="my-name">{me.name}</div>
            <div className="my-status-row">
              <span className="my-status-text">
                {me.status ? `«${me.status}»` : 'нет девиза'}
              </span>
            </div>
            <div className="chad-pts-badge">
              💪 {me.steps || 0} очков
            </div>
          </div>
        </div>
        <div className="hdr-right">
          <div className="hdr-timer">
            <div className="hdr-timer-label">До лета</div>
            <div className="hdr-timer-val">{daysUntilSummer()}д</div>
            <div className="hdr-timer-label" style={{ marginTop: 4 }}>До конца недели</div>
            <div className="hdr-timer-val">{untilMonday()}</div>
          </div>
          <button className="btn-sm" onClick={onBack}>← Игроки</button>
          <button className="btn-sm" onClick={() => setShowWeight(true)}>⚖️ Вес</button>
        </div>
      </div>

      {showWeight && <WeightModal onClose={() => setShowWeight(false)} />}

      {/* Hall of Chads + Day Chad */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:16 }}>
        <div style={{ flex:1, minWidth:0 }}><HallOfChads /></div>
        <DayChad />
      </div>

      {/* Track */}
      <div className="track-box" style={{ marginBottom: 14 }}>
        <div className="track-title">🏁 Путь от Скуфа к Легенде</div>
        <Track />
      </div>

      {/* Weight chart */}
      <WeightChart />

      {/* Team battle */}
      <TeamBattle />

      {/* Shame */}
      <ShameBoard state={state} />

      {/* Exercise panel */}
      <ExercisePanel showToast={showToast} onEvent={onEvent} onMilestone={onMilestone} onNewAchievements={onNewAchievements} />

      {/* Leaderboard — collapsible */}
      <Collapsible title="👑 Таблица Чадов">
        <Leaderboard state={state} myId={myId} />
      </Collapsible>

      {/* Today stats — collapsible */}
      <Collapsible title="📊 Что сделали сегодня">
        <TodayStats state={state} myId={myId} />
      </Collapsible>

      {/* Chat */}
      <Chat />
    </div>
  );
}
