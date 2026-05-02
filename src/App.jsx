import { useState, useEffect } from 'react';
import { ref, remove } from 'firebase/database';
import { db, isConfigured } from './firebase.js';
import { GameProvider, useGame } from './GameContext.jsx';
import { ADMIN_PASS, QUOTES, SHAME_MSGS } from './constants.js';
import { daysSince, rand } from './utils.js';
import { useToast } from './useToast.js';

import Toast          from './components/Toast.jsx';
import HomeScreen     from './components/HomeScreen.jsx';
import CreateScreen   from './components/CreateScreen.jsx';
import RaceScreen     from './components/RaceScreen.jsx';
import ProfileModal   from './components/ProfileModal.jsx';
import MilestoneModal from './components/MilestoneModal.jsx';

function AdminModal({ onSuccess, onClose }) {
  const [pass, setPass] = useState('');
  const [err,  setErr]  = useState(false);
  function check() {
    if (pass === ADMIN_PASS) { onSuccess(); onClose(); }
    else { setErr(true); setPass(''); }
  }
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal admin" onClick={e => e.stopPropagation()}>
        <div className="m-admin-title">🔐 Только для избранных</div>
        {err && <div className="m-err show">Пароль скуфа не подходит 🥔</div>}
        <input type="password" className="m-input" placeholder="Введи пароль..."
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()} autoFocus />
        <button className="btn-red" onClick={check}>Войти</button>
        <br />
        <button className="m-cancel" onClick={onClose}>Я просто скуф</button>
      </div>
    </div>
  );
}

function WinnerModal({ winner, loser, onClose }) {
  if (!winner) return null;
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal winner" onClick={e => e.stopPropagation()}>
        <div className="m-trophy">🏆</div>
        <div className="m-title">GIGACHAD<br />НЕДЕЛИ!</div>
        <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', border:'3px solid var(--gold)', margin:'0 auto 12px' }}>
          {winner.photo
            ? <img src={winner.photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', background:'var(--surf2)' }}>{winner.name[0]}</div>
          }
        </div>
        <div className="m-winner-name">{winner.name}</div>
        <div className="m-winner-steps">{winner.steps} очков Чадизма за неделю</div>
        {loser && <div style={{ fontSize:'.75rem', color:'var(--red)', fontWeight:800, marginBottom:16, fontFamily:"'Oswald'" }}>🥔 Главный Скуф недели: {loser.name}</div>}
        <button className="btn-gold" onClick={onClose}>🎉 НОВАЯ НЕДЕЛЯ!</button>
      </div>
    </div>
  );
}

function EventModal({ event, baseTotal, finalTotal, onAccept }) {
  if (!event) return null;
  const bonusStr = event.type === 'multiplier'
    ? `${baseTotal} × ${event.val} = ${finalTotal} очков!`
    : `${baseTotal} + ${event.val} = ${finalTotal} очков!`;
  return (
    <div className="modal-overlay show">
      <div className="modal event">
        <div className="ev-label">Случайное событие</div>
        <div className="ev-emoji">{event.emoji}</div>
        <div className="ev-title">{event.title}</div>
        <div className="ev-desc">{event.desc}</div>
        <div className="ev-bonus">{bonusStr}</div>
        <button className="btn-gold" onClick={onAccept}>ПРИНЯТЬ 💪</button>
      </div>
    </div>
  );
}

function ShameScreen({ days, onClose }) {
  return (
    <div id="shame-screen" className="show">
      <div className="shame-headline">ГДЕ<br />ТЫ БЫЛ?</div>
      <div className="shame-sub">Дней без тренировки:</div>
      <div className="shame-days">{days}</div>
      <div className="shame-msg">{rand(SHAME_MSGS)}</div>
      <button className="btn-shame-close" onClick={onClose}>😤 ИСПРАВЛЯЮСЬ</button>
    </div>
  );
}

function AppInner() {
  const { state, myId, isAdmin, setIsAdmin, selectPlayer, clearPlayer, ready, onOvertake } = useGame();
  const { toast, showToast } = useToast();

  const [screen,       setScreen]       = useState('home');
  const [showAdmin,    setShowAdmin]     = useState(false);
  const [showProfile,  setShowProfile]   = useState(false);
  const [milestoneAt,  setMilestoneAt]   = useState(null);
  const [newAchievs,   setNewAchievs]    = useState(null); // array of achievement ids
  const [winnerData,   setWinnerData]    = useState(null);
  const [eventData,    setEventData]     = useState(null);
  const [shameData,    setShameData]     = useState(null);
  const [quoteBanner,  setQuoteBanner]   = useState(null);

  useEffect(() => {
    return onOvertake((name) => {
      const msgs = [
        n => `😱 ${n.toUpperCase()} ТЕБЯ ОБОГНАЛ! Вставай с дивана!`,
        n => `🔥 ${n} наступает! Он уже впереди!`,
        n => `💀 ${n} промчался мимо! Ты это видел?!`,
        n => `🥔 ${n} обогнал тебя пока ты читал это сообщение.`,
        n => `🐢 Ты стал черепахой. ${n} — заяц.`,
      ];
      showToast(rand(msgs)(name), true);
    });
  }, [onOvertake]);

  function goToRace(id) {
    selectPlayer(id);
    const me = state.players[id];
    if (me && daysSince(me.lastActiveDate) >= 3) {
      setShameData(daysSince(me.lastActiveDate));
      return;
    }
    setScreen('race');
  }

  function handleAdmin(action, id, name) {
    if (action === 'login')  { setShowAdmin(true); return; }
    if (action === 'exit')   { setIsAdmin(false); showToast('Режим администратора выключен'); return; }
    if (action === 'delete') {
      if (confirm(`Удалить «${name}»?`)) {
        remove(ref(db, `fitrace/players/${id}`));
        if (myId === id) clearPlayer();
        showToast(`Игрок «${name}» удалён`);
      }
    }
  }

  if (!isConfigured()) {
    return (
      <div style={{ maxWidth:580, margin:'0 auto', padding:'40px 20px' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div className="game-logo">WANTTO<span className="logo-sub">BEGIGACHAD</span></div>
        </div>
        <div style={{ background:'rgba(255,45,45,.08)', border:'1px solid rgba(255,45,45,.25)', borderRadius:12, padding:'14px 18px', marginBottom:16, fontSize:'.85rem', fontWeight:800, color:'var(--red)', textAlign:'center' }}>
          ⚙️ Вставь Firebase Config в src/firebase.js
        </div>
        <div style={{ background:'var(--surf)', border:'1px solid var(--border)', borderRadius:14, padding:22, fontSize:'.82rem', fontWeight:700, color:'var(--dim)', lineHeight:2 }}>
          <b style={{ color:'var(--text)' }}>Инструкция:</b><br />
          1. <a href="https://console.firebase.google.com" target="_blank" style={{ color:'var(--gold)' }}>console.firebase.google.com</a> → Создать проект<br />
          2. Build → Realtime Database → Create → Test mode<br />
          3. Project settings → Your apps → Web → скопируй firebaseConfig<br />
          4. Вставь в <code>src/firebase.js</code><br />
          5. <code>npm run build</code> → залей папку <code>dist/</code> на GitHub Pages
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
        <div className="game-logo">WANTTO<span className="logo-sub">BEGIGACHAD</span></div>
        <div className="loading">Подключение <span className="spin" /></div>
      </div>
    );
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          onSelect={goToRace}
          onCreate={() => setScreen('create')}
          isAdmin={isAdmin}
          onAdminClick={handleAdmin}
        />
      )}
      {screen === 'create' && (
        <CreateScreen
          onBack={() => setScreen('home')}
          onCreated={id => goToRace(id)}
          editingId={null}
        />
      )}
      {screen === 'race' && (
        <RaceScreen
          onBack={() => setScreen('home')}
          showToast={showToast}
          onEvent={(ev, base, final, cb) => setEventData({ ev, base, final, cb })}
          onMilestone={pts => setMilestoneAt(pts)}
          onOpenProfile={() => setShowProfile(true)}
          onNewAchievements={ids => setNewAchievs(ids)}
        />
      )}

      {showAdmin   && <AdminModal onSuccess={() => setIsAdmin(true)} onClose={() => setShowAdmin(false)} />}
      {showProfile && myId && <ProfileModal onClose={() => setShowProfile(false)} />}
      {milestoneAt && <MilestoneModal pts={milestoneAt} onClose={() => setMilestoneAt(null)} />}
      {newAchievs  && <AchievementPopup ids={newAchievs} onClose={() => setNewAchievs(null)} />}
      {winnerData  && <WinnerModal winner={winnerData.winner} loser={winnerData.loser} onClose={() => setWinnerData(null)} />}
      {eventData   && <EventModal event={eventData.ev} baseTotal={eventData.base} finalTotal={eventData.final} onAccept={() => { eventData.cb(); setEventData(null); }} />}
      {shameData   && <ShameScreen days={shameData} onClose={() => { setShameData(null); setScreen('race'); }} />}

      <Toast msg={toast.msg} err={toast.err} visible={toast.visible} />
    </>
  );
}

export default function App() {
  return <GameProvider><AppInner /></GameProvider>;
}
