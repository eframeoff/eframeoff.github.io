import { useState, useEffect, useRef } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../firebase.js';
import { useGame } from '../GameContext.jsx';
import Avatar from './Avatar.jsx';

// ── Exercise labels ───────────────────────────────────────────────
const EX_LABELS = {
  pullups: { icon: '🏋️', label: 'подтягиваний' },
  pushups: { icon: '💪', label: 'отжиманий' },
  dips:    { icon: '🤸', label: 'брусьев' },
  squats:  { icon: '🦵', label: 'приседаний' },
  abs:     { icon: '🧱', label: 'мин планки' },
  run_km:  { icon: '🏃', label: 'км бега' },
  beer:    { icon: '🍺', label: 'пиво' },
  spirit:  { icon: '🥃', label: 'крепкое' },
  wine:    { icon: '🍷', label: 'вино' },
};

function formatEntry(entry) {
  const parts = [];
  ['pullups','pushups','dips','squats','abs','run_km'].forEach(k => {
    if (!entry[k]) return;
    const { icon, label } = EX_LABELS[k];
    const val = k === 'abs' ? `${entry[k]} мин` : entry[k];
    parts.push(`${icon} ${val} ${label}`);
  });
  if (entry.alco && EX_LABELS[entry.alco]) {
    const { icon, label } = EX_LABELS[entry.alco];
    parts.push(`${icon} ${label} (-)`);
  }
  return parts.join(', ');
}

function timeAgoShort(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000)    return 'только что';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Activity History ──────────────────────────────────────────────
function ActivityHistory() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const players = state.players;

  // Last 7 days of logs, sorted newest first
  const cutoff = Date.now() - 7 * 24 * 3600000;
  const entries = Object.entries(state.activityLog || {})
    .map(([k, v]) => ({ key: k, ...v }))
    .filter(e => (e.ts || 0) > cutoff)
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 100);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Oswald',sans-serif", fontSize: '.72rem',
          fontWeight: 700, color: 'var(--dim)',
          textTransform: 'uppercase', letterSpacing: 2,
        }}
      >
        <span>📋 История трень</span>
        <span style={{
          fontSize: '.65rem', transition: 'transform .2s',
          transform: open ? 'rotate(180deg)' : 'none',
          color: 'var(--dim)',
        }}>▼</span>
      </button>

      {/* List */}
      {open && (
        <div style={{
          maxHeight: 260, overflowY: 'auto',
          padding: '4px 14px 12px',
        }}>
          {entries.length === 0 ? (
            <div style={{
              textAlign: 'center', color: 'var(--dim)',
              fontSize: '.8rem', fontWeight: 700, padding: '16px 0',
            }}>Пока тишина. Идите тренироваться 🛋️</div>
          ) : entries.map(e => {
            const p = players[e.uid];
            const color = p?.color || '#FFB800';
            const detail = formatEntry(e);
            if (!detail) return null;
            return (
              <div key={e.key} style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '7px 0',
                borderBottom: '1px solid rgba(255,255,255,.04)',
              }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  {p
                    ? <Avatar player={p} size={26} />
                    : <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: color + '22', border: `1.5px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.7rem', fontWeight: 900, color,
                      }}>{(e.name || '?')[0].toUpperCase()}</div>
                  }
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'Oswald',sans-serif", fontWeight: 700,
                      fontSize: '.82rem', color,
                    }}>{e.name || p?.name || '?'}</span>
                    <span style={{
                      fontSize: '.68rem', color: 'var(--dim)', fontWeight: 700,
                    }}>{timeAgoShort(e.ts)}</span>
                    <span style={{
                      fontFamily: "'Press Start 2P',monospace",
                      fontSize: '.48rem', color: 'var(--gold)',
                    }}>+{e.pts}</span>
                  </div>
                  <div style={{
                    fontSize: '.76rem', color: 'rgba(255,255,255,.55)',
                    fontWeight: 700, marginTop: 2,
                  }}>{detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────────────
export default function Chat() {
  const { state, myId } = useGame();
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef    = useRef(null);
  const containerRef = useRef(null);
  const wasAtBottomRef = useRef(false);
  const mountedRef     = useRef(false);

  const messages = Object.entries(state.chat || {})
    .map(([key, m]) => ({ key, ...m }))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || !myId || sending) return;
    const senderId   = myId;
    const senderData = state.players[senderId];
    if (!senderData) return;
    setSending(true);
    setText('');
    wasAtBottomRef.current = true;
    try {
      const msgKey = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await set(ref(db, `fitrace/chat/${msgKey}`), {
        uid:   senderId,
        name:  senderData.name,
        color: senderData.color,
        text:  trimmed,
        ts:    Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-box" id="chat-anchor">
      {/* History tab */}
      <ActivityHistory />

      {/* Chat header */}
      <div className="chat-header">
        <div className="chat-title">💬 Общий чат скуфов</div>
      </div>

      <div ref={containerRef} className="chat-messages" onScroll={handleScroll}>
        {messages.length === 0
          ? <div className="chat-empty">Пока тишина. Напиши первым, скуф.</div>
          : messages.map(m => {
              const isMe = m.uid === myId;
              const color       = m.color || state.players[m.uid]?.color || '#FFB800';
              const displayName = m.name  || state.players[m.uid]?.name  || '?';
              const p           = state.players[m.uid];
              const time = m.ts
                ? new Date(m.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <div key={m.key} className={`chat-msg${isMe ? ' mine' : ''}`}>
                  <div className="chat-msg-av" style={{ color }}>
                    {p?.photo
                      ? <img src={p.photo} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`1.5px solid ${color}` }} />
                      : <div style={{ width:28, height:28, borderRadius:'50%', background:color+'22', border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', fontWeight:900, color }}>
                          {displayName[0].toUpperCase()}
                        </div>
                    }
                  </div>
                  <div>
                    <div className="chat-bubble">{m.text}</div>
                    <div className="chat-meta" style={{ color }}>
                      {isMe ? 'ты' : displayName} · {time}
                    </div>
                  </div>
                </div>
              );
            })
        }
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Напиши что-нибудь..."
          maxLength={200}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={!myId}
        />
        <button className="chat-send" onClick={send}
          disabled={!text.trim() || !myId || sending}>
          ➤
        </button>
      </div>
    </div>
  );
}
