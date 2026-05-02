import { useState } from 'react';
import { useGame } from '../GameContext.jsx';
import { daysUntilSummer, untilMonday, isOnline } from '../utils.js';
import { MAX_PLAYERS } from '../constants.js';
import Avatar from './Avatar.jsx';
import PinModal from './PinModal.jsx';
import EventFeed from './EventFeed.jsx';
import AchievementBadges from './AchievementBadges.jsx';
import VersionModal from './VersionModal.jsx';

function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h) + pin.charCodeAt(i);
  return (h >>> 0).toString(16);
}

export default function HomeScreen({ onSelect, onCreate, isAdmin, onAdminClick }) {
  const { state } = useGame();
  const [pinTarget, setPinTarget] = useState(null); // { id, name, color }
  const [pinError,  setPinError]  = useState(false);
  const pl = state.players;
  const sorted = Object.entries(pl).sort((a, b) => (b[1].steps || 0) - (a[1].steps || 0));
  const count = sorted.length;
  const rankEmoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  function handleSelect(id) {
    const p = state.players[id];
    if (!p) return;
    // If no PIN set — let through (legacy players)
    if (!p.pinHash) { onSelect(id); return; }
    // If device already authenticated — let through
    const saved = localStorage.getItem(`auth_${id}`);
    if (saved && saved === p.pinHash) { onSelect(id); return; }
    // Otherwise show PIN modal
    setPinError(false);
    setPinTarget({ id, name: p.name, color: p.color });
  }

  function handlePinSuccess(enteredPin) {
    if (!pinTarget) return;
    const p = state.players[pinTarget.id];
    if (!p) return;
    if (hashPin(enteredPin) === p.pinHash) {
      localStorage.setItem(`auth_${pinTarget.id}`, p.pinHash);
      setPinTarget(null);
      onSelect(pinTarget.id);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 600);
    }
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 18px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '28px 0 14px' }}>
        <div className="game-logo">WANTTO<span className="logo-sub">BEGIGACHAD</span></div>
        <div className="game-sub">🥔 Скуфы качаются к лету 🥔</div>
        <div className="summer-strip">☀️ До лета: <strong>{daysUntilSummer()}</strong> дней</div>
      </div>

      {/* Week banner with live feed inside */}
      <div className="week-banner" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10 }}>
          <div className="wb-item">
            <div className="wb-label">До лета</div>
            <div className="wb-val wb-orange">{daysUntilSummer()}д</div>
          </div>
          <div className="wb-divider" />
          <div className="wb-item">
            <div className="wb-label">До конца недели</div>
            <div className="wb-val wb-gold" style={{ fontSize: '.6rem' }}>{untilMonday()}</div>
          </div>
          <div className="wb-divider" />
          <div className="wb-item">
            <div className="wb-label">Участников</div>
            <div className="wb-val wb-gold">{count}/{MAX_PLAYERS}</div>
          </div>
        </div>
        {/* Live feed */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 10 }}>
          <EventFeed />
        </div>
      </div>

      {/* Player list */}
      {count === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🥔</div>
          <div style={{ fontFamily: "'Oswald'", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dim)' }}>
            Первый скуф ещё не зарегался
          </div>
        </div>
      ) : (
        <>
          <div className="sec-label" style={{ marginBottom: 11 }}>Выбери персонажа</div>
          {sorted.map(([id, p], i) => {
            return (
              <div key={id} className="player-card" onClick={() => handleSelect(id)}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar player={p} size={68} />
                  {isOnline(p.lastSeen) && <div className="online-dot" style={{ position: 'absolute', bottom: 3, right: 3 }} />}
                </div>
                <div className="player-info">
                  <div className="player-name" style={{ color: p.color }}>{p.name}</div>
                  {p.status && <div className="player-status">«{p.status}»</div>}
                  <AchievementBadges achievements={p.achievements || {}} size={22} />
                </div>
                <div className="player-right">
                  {isAdmin && (
                    <button className="btn-delete" onClick={e => { e.stopPropagation(); onAdminClick('delete', id, p.name); }}>🗑</button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      <button className="btn-create" disabled={count >= MAX_PLAYERS} onClick={onCreate}>
        {count >= MAX_PLAYERS ? `⛔ Уже ${MAX_PLAYERS} скуфов (максимум)` : '+ Зарегистрировать нового Чада'}
      </button>

      <div className="admin-strip">
        <button className={`btn-admin${isAdmin ? ' on' : ''}`} onClick={() => onAdminClick(isAdmin ? 'exit' : 'login')}>
          {isAdmin ? '🔓 Режим админа активен' : '🔐 Вход для администратора'}
        </button>
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <VersionModal />
      </div>

      {pinTarget && (
        <PinModal
          playerName={pinTarget.name}
          playerColor={pinTarget.color}
          shake={pinError}
          onSuccess={handlePinSuccess}
          onClose={() => setPinTarget(null)}
        />
      )}
    </div>
  );
}
