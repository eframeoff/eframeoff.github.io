import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase.js';
import { useGame } from '../GameContext.jsx';
import { EVENTS, COACH_LOW, COACH_MID, COACH_HIGH, COACH_INSANE, OVERTAKE_MSGS } from '../constants.js';
import { todayStr, yesterdayStr, getMilestoneKey, rand } from '../utils.js';
import { notify } from '../notify.js';
import { checkAchievements, ACHIEVEMENT_MAP } from '../achievements.js';

// Exercise definitions
const STRENGTH = [
  // Верх тела
  { key: 'pullups',  icon: '🏋️', name: 'Подтяг',    pts: 4,   group: 'upper' },
  { key: 'pushups',  icon: '💪',  name: 'Отжим',     pts: 2,   group: 'upper' },
  { key: 'dips',     icon: '🤸',  name: 'Брусья',    pts: 3,   group: 'upper' },
  // Низ / Кор
  { key: 'squats',   icon: '🦵',  name: 'Присед',    pts: 1,   group: 'lower' },
  { key: 'abs',      icon: '🧱', name: 'Планка',    pts: 15,  group: 'lower', unit: '×1мин'  },
  { key: 'press',    icon: '🔥',  name: 'Пресс',     pts: 0.3, group: 'lower', unit: '×10раз' },
];

const ALCOHOL = [
  { key: 'beer',   icon: '🍺', name: 'Каюсь, пил пиво',       pts: -20, msg: null },
  { key: 'spirit', icon: '🥃', name: 'Каюсь, пил крепенькое', pts: -30, msg: null },
  { key: 'wine',   icon: '🍷', name: 'Каюсь, пил вино',       pts: +10, msg: '🍷 Вино — это культура! Учёные доказали: бокал вина = лёгкая тренировка. +10 очков!' },
];

function AlcoholPanel({ selected, onSelect }) {
  const { state, myId } = useGame();

  // Check what's already been logged today
  const today = new Date().toISOString().slice(0, 10);
  const todayD = state.daily?.[today]?.[myId] || {};
  const alreadyLogged = {
    beer:   (todayD.beer   || 0) > 0,
    spirit: (todayD.spirit || 0) > 0,
    wine:   (todayD.wine   || 0) > 0,
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Hint */}
      <div style={{
        background:'rgba(255,184,0,.08)', border:'1px solid rgba(255,184,0,.18)',
        borderRadius:10, padding:'9px 13px',
        fontSize:'.78rem', color:'rgba(255,255,255,.6)',
        fontFamily:"'Oswald',sans-serif", fontWeight:700, letterSpacing:.3,
      }}>
        🍻 Укажи напиток который употреблял сегодня
      </div>

      {ALCOHOL.map(al => {
        const isSelected = selected === al.key;
        const done = alreadyLogged[al.key];
        return (
          <div
            key={al.key}
            onClick={() => !done && onSelect(isSelected ? null : al.key)}
            style={{
              display:'flex', alignItems:'center', gap:12,
              borderRadius:12, padding:'13px 14px',
              border: done ? '1px solid rgba(255,255,255,.06)' : isSelected ? '2px solid var(--red)' : '1px solid var(--border)',
              background: done ? 'rgba(255,255,255,.03)' : isSelected ? 'rgba(255,45,45,.08)' : 'var(--surf2)',
              cursor: done ? 'default' : 'pointer', transition:'all .15s',
              opacity: done ? 0.5 : 1,
              WebkitTapHighlightColor:'transparent',
            }}
          >
            <span style={{ fontSize:'1.6rem', flexShrink:0 }}>{al.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{
                fontFamily:"'Oswald',sans-serif", fontSize:'.88rem',
                fontWeight:700, color: done ? 'var(--dim)' : isSelected ? 'var(--text)' : 'var(--dim)',
              }}>{al.name}</div>
              {done && <div style={{ fontSize:'.65rem', color:'var(--dim)', fontWeight:700 }}>уже записано сегодня</div>}
            </div>
            {done
              ? <span style={{ fontSize:'.9rem', flexShrink:0 }}>✅</span>
              : <div style={{
                  width:24, height:24, borderRadius:'50%', flexShrink:0,
                  border: `2px solid ${isSelected ? 'var(--red)' : 'rgba(255,255,255,.15)'}`,
                  background: isSelected ? 'var(--red)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'.75rem', color:'#000', fontWeight:900, transition:'all .15s',
                }}>{isSelected ? '✓' : ''}</div>
            }
          </div>
        );
      })}
    </div>
  );
}
function TapCard({ ex, count, onTap, onReset }) {
  // Format display value — planck shows minutes (×0.5), others show reps
  const displayCount = ex.key === 'abs'
    ? count === 0 ? '+' : `${count}мин`
    : count > 0 ? count : '+';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--surf2)', borderRadius: 12,
      padding: '10px 12px',
      border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{ex.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif", fontSize: '.8rem',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px',
        }}>{ex.name}</div>
        <div style={{
          fontSize: '.65rem', color: 'var(--gold)', fontWeight: 800,
          fontFamily: "'Oswald',sans-serif",
        }}>× {ex.pts} оч.{ex.unit ? ` / ${ex.unit}` : ''}</div>
      </div>

      {/* Counter controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {count > 0 && (
          <button
            onClick={onReset}
            style={{
              background: 'none', border: 'none', color: 'var(--dim)',
              fontSize: '.75rem', cursor: 'pointer', padding: '2px 4px',
              fontFamily: "'Nunito',sans-serif", fontWeight: 800,
            }}
          >✕</button>
        )}
        <button
          onPointerDown={onTap}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: count > 0
              ? `linear-gradient(135deg,var(--orange),var(--red))`
              : 'var(--surf)',
            border: count > 0
              ? '2px solid transparent'
              : '2px solid var(--border)',
            color: 'white',
            fontSize: count > 0 ? (ex.key === 'abs' ? '.85rem' : '1.15rem') : '1.3rem',
            fontWeight: 900, fontFamily: "'Oswald',sans-serif",
            cursor: 'pointer', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'transform .08s, background .15s',
            flexShrink: 0,
          }}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {displayCount}
        </button>
      </div>
    </div>
  );
}

// Cardio — running with km selector
function CardioPanel({ km, onAdd, onReset }) {
  const KM_OPTIONS = [1, 2, 3, 5, 10];
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{
        fontFamily: "'Oswald',sans-serif", fontSize: '.72rem', fontWeight: 700,
        color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: 1.5,
        marginBottom: 10,
      }}>
        🏃 Бег — минимум 1 км, +40 очков за км
      </div>

      {/* KM quick-tap buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {KM_OPTIONS.map(k => (
          <button
            key={k}
            onClick={() => onAdd(k)}
            style={{
              padding: '10px 16px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surf2)',
              color: 'var(--text)', fontFamily: "'Oswald',sans-serif",
              fontSize: '.9rem', fontWeight: 700, cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >+{k} км</button>
        ))}
      </div>

      {/* Current km */}
      {km > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(57,255,20,.07)', border: '1px solid rgba(57,255,20,.2)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <span style={{ flex: 1, fontFamily: "'Oswald',sans-serif", fontWeight: 700 }}>
            🏃 {km} км = <span style={{ color: 'var(--gold)' }}>{km * 40} очков</span>
          </span>
          <button
            onClick={onReset}
            style={{
              background: 'none', border: 'none', color: 'var(--dim)',
              fontSize: '.8rem', cursor: 'pointer', fontWeight: 800,
              fontFamily: "'Nunito',sans-serif",
            }}
          >✕ сбросить</button>
        </div>
      )}
    </div>
  );
}

export default function ExercisePanel({ showToast, onEvent, onMilestone, onNewAchievements }) {
  const { state, myId } = useGame();

  const [tab,    setTab]    = useState('strength'); // 'strength' | 'cardio'
  const [counts, setCounts] = useState({ pullups:0, pushups:0, dips:0, squats:0, abs:0, press:0 });
  const [alco,   setAlco]   = useState(null); // selected drink key or null
  const [km,     setKm]     = useState(0);
  const [saving, setSaving] = useState(false);

  // Total points
  const strengthPts = STRENGTH.reduce((acc, ex) => acc + (counts[ex.key] || 0) * ex.pts, 0);
  const cardioPts   = km * 40;
  const alcoPts     = alco ? (ALCOHOL.find(a=>a.key===alco)?.pts||0) : 0;
  const total       = Math.round(strengthPts + cardioPts + alcoPts);

  function tap(key) { setCounts(c => ({ ...c, [key]: (c[key] || 0) + 1 })); }
  function resetKey(key) { setCounts(c => ({ ...c, [key]: 0 })); }

  async function submit() {
    if (!total || !myId || saving) return;
    if (total > 500) { showToast('🚨 500+ очков за раз?! Нас не обманешь, скуф!', true); return; }
    const me = state.players[myId];
    if (!me) return;

    // 1% random event
    if (Math.random() < 0.01) {
      const ev = rand(EVENTS);
      const finalTotal = ev.type === 'multiplier' ? Math.round(total * ev.val) : total + ev.val;
      onEvent(ev, total, finalTotal, () => doSave({ ...counts }, km, finalTotal, alco));
      setCounts({ pullups:0, pushups:0, dips:0, squats:0, abs:0, press:0 });
      setAlco(null);
      setKm(0);
      return;
    }

    // Wine easter egg toast
    if (alco === 'wine') {
      setTimeout(() => showToast(ALCOHOL.find(a=>a.key==='wine').msg), 400);
    }

    setSaving(true);
    await doSave({ ...counts }, km, total, alco);
    setSaving(false);
    setCounts({ pullups:0, pushups:0, dips:0, squats:0, abs:0, press:0 });
    setAlco(null);
    setKm(0);
  }

  async function doSave(c, runKm, pts, alcoC = null) {
    const me = state.players[myId];
    if (!me) return;
    const today = todayStr(), yStr = yesterdayStr();
    const curSteps = me.steps || 0;
    const todayD   = state.daily?.[today]?.[myId] || {};

    // Streak
    const lastDate = me.lastActiveDate || '';
    let streak = me.streak || 0;
    if      (lastDate === today) { /* same day */ }
    else if (lastDate === yStr)  { streak++; }
    else                         { streak = 1; }

    const newTotal   = curSteps + pts;
    const overtaken  = Object.entries(state.players).filter(([id, p]) =>
      id !== myId && p.steps > curSteps && p.steps <= newTotal
    );

    const upd = {};
    upd[`fitrace/players/${myId}/steps`]         = newTotal;
    upd[`fitrace/players/${myId}/lastActiveDate`] = today;
    upd[`fitrace/players/${myId}/streak`]         = streak;
    upd[`fitrace/players/${myId}/lastSeen`]       = Date.now();
    // Save all exercise counts
    upd[`fitrace/daily/${today}/${myId}/pullups`] = (todayD.pullups || 0) + (c.pullups || 0);
    upd[`fitrace/daily/${today}/${myId}/pushups`] = (todayD.pushups || 0) + (c.pushups || 0);
    upd[`fitrace/daily/${today}/${myId}/dips`]    = (todayD.dips    || 0) + (c.dips    || 0);
    upd[`fitrace/daily/${today}/${myId}/squats`]  = (todayD.squats  || 0) + (c.squats  || 0);
    upd[`fitrace/daily/${today}/${myId}/abs`]     = (todayD.abs     || 0) + (c.abs     || 0);
    upd[`fitrace/daily/${today}/${myId}/press`]   = (todayD.press   || 0) + (c.press   || 0);
    upd[`fitrace/daily/${today}/${myId}/run_km`]  = (todayD.run_km  || 0) + runKm;
    if (alcoC) upd[`fitrace/daily/${today}/${myId}/${alcoC}`] = (todayD[alcoC] || 0) + 1;

    // Write workout to activity log
    const logKey = `${Date.now()}_${myId.slice(-4)}`;
    const logEntry = { uid: myId, name: me.name, ts: Date.now(), pts, type: 'workout' };
    if (c.pullups) logEntry.pullups = c.pullups;
    if (c.pushups) logEntry.pushups = c.pushups;
    if (c.dips)    logEntry.dips    = c.dips;
    if (c.squats)  logEntry.squats  = c.squats;
    if (c.abs)     logEntry.abs     = c.abs;
    if (c.press)   logEntry.press   = c.press;
    if (runKm)     logEntry.run_km  = runKm;
    if (alcoC)     logEntry.alco    = alcoC;
    upd[`fitrace/activityLog/${logKey}`] = logEntry;

    // Check and award achievements
    const updatedPlayer = { ...me, steps: newTotal, streak, lastActiveDate: today };
    const existingIds   = Object.keys(me.achievements || {});
    const newAchievements = checkAchievements(updatedPlayer, state.daily, myId, existingIds);
    if (newAchievements.length > 0) {
      newAchievements.forEach(id => {
        upd[`fitrace/players/${myId}/achievements/${id}`] = Date.now();
      });
      // Toast for each new achievement (delayed so workout toast shows first)
      newAchievements.forEach((id, i) => {
        const a = ACHIEVEMENT_MAP[id];
        if (a) setTimeout(() => showToast(`${a.icon} Ачивка: ${a.name}!`), 3500 + i * 2000);
      });
    }

    await update(ref(db), upd);

    // Log overtake events separately
    if (overtaken.length > 0) {
      const overtakeUpds = {};
      overtaken.forEach(([, p]) => {
        const ok = `${Date.now() + Math.random()}_ovt`;
        overtakeUpds[`fitrace/activityLog/${ok}`] = {
          type: 'overtake', ts: Date.now(),
          actor: me.name, actorUid: myId,
          target: p.name, targetUid: p.id || '',
        };
      });
      update(ref(db), overtakeUpds);
    }

    // Telegram notifications (fire-and-forget)
    notify.workout(me.name, pts, c, runKm);
    if (overtaken.length > 0) {
      overtaken.forEach(([, p]) => notify.overtake(me.name, p.name));
    }

    const reps = Object.values(c).reduce((a, b) => a + b, 0) + runKm;
    const pool = reps < 10 ? COACH_LOW : reps < 60 ? COACH_MID : reps < 150 ? COACH_HIGH : COACH_INSANE;
    showToast(rand(pool));

    if (overtaken.length > 0) {
      overtaken.forEach(([, p], i) => {
        setTimeout(() => showToast(rand(OVERTAKE_MSGS)(p.name)), 1600 + i * 2000);
      });
    }
    if (streak >= 3) setTimeout(() => showToast(`🔥 Серия ${streak} дней! Сигма-режим!`), 2500);


    // Milestones
    const key   = getMilestoneKey(myId);
    const shown = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
    for (const t of [50, 100, 200, 300, 500, 1000]) {
      if (curSteps < t && newTotal >= t && !shown.has(t)) {
        shown.add(t);
        localStorage.setItem(key, JSON.stringify([...shown]));
        setTimeout(() => onMilestone(t), 900);
        notify.milestone(me.name, t);
        break;
      }
    }
  }

  const upper = STRENGTH.filter(e => e.group === 'upper');
  const lower = STRENGTH.filter(e => e.group === 'lower');

  return (
    <div className="action-panel">
      {/* Tab switcher */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[
          { id:'strength', label:'💪 Силовые' },
          { id:'cardio',   label:'🏃 Кардио'  },
          { id:'alcohol',  label:'🍺 Алко'    },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex:1, padding:'10px 0',
              borderRadius:10, border:'none',
              background: tab === t.id
                ? 'linear-gradient(135deg,var(--orange),var(--red))'
                : 'var(--surf2)',
              color: tab === t.id ? '#fff' : 'var(--dim)',
              fontFamily:"'Oswald',sans-serif",
              fontSize:'.88rem', fontWeight:700,
              cursor:'pointer', touchAction:'manipulation',
              letterSpacing:'.5px', textTransform:'uppercase',
              transition:'all .15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Strength tab */}
      {tab === 'strength' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {/* Upper body group */}
          <div style={{
            fontSize:'.62rem', fontFamily:"'Oswald',sans-serif", fontWeight:700,
            color:'var(--dim)', textTransform:'uppercase', letterSpacing:2,
            marginBottom:2, paddingLeft:2,
          }}>Верх тела</div>
          {upper.map(ex => (
            <TapCard key={ex.key} ex={ex} count={counts[ex.key]}
              onTap={() => tap(ex.key)} onReset={() => resetKey(ex.key)} />
          ))}

          {/* Lower / Core group */}
          <div style={{
            fontSize:'.62rem', fontFamily:"'Oswald',sans-serif", fontWeight:700,
            color:'var(--dim)', textTransform:'uppercase', letterSpacing:2,
            marginTop:6, marginBottom:2, paddingLeft:2,
          }}>Низ / Кор</div>
          {lower.map(ex => (
            <TapCard key={ex.key} ex={ex} count={counts[ex.key]}
              onTap={() => tap(ex.key)} onReset={() => resetKey(ex.key)} />
          ))}
        </div>
      )}

      {/* Cardio tab */}
      {tab === 'cardio' && (
        <CardioPanel km={km} onAdd={k => setKm(prev => prev + k)} onReset={() => setKm(0)} />
      )}

      {tab === 'alcohol' && (
        <AlcoholPanel selected={alco} onSelect={setAlco} />
      )}
      <div className="submit-row" style={{ marginTop:14 }}>
        <div className="pts-preview">
          Итого: <strong>{total} очков Чадизма</strong>
        </div>
        <button className="btn-go" onClick={submit} disabled={!total || saving}>
          {saving ? 'СЧИТАЕМ...' : 'ЗАЧЕСТЬ 💀'}
        </button>
      </div>
    </div>
  );
}
