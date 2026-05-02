import { useState, useEffect, useRef } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase.js';
import { useGame } from '../GameContext.jsx';
import { compressPhoto } from '../utils.js';
import Avatar from './Avatar.jsx';
import AchievementBadges from './AchievementBadges.jsx';

function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h) + pin.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function PinPad({ value, onChange, label }) {
  const digits = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];
  function tap(d) {
    if (d === '⌫') { onChange(value.slice(0,-1)); return; }
    if (value.length >= 4) return;
    onChange(value + d);
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="form-label" style={{ marginBottom: 8 }}>{label}</div>
      {/* Dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:12, height:12, borderRadius:'50%',
            background: i < value.length ? 'var(--gold)' : 'var(--surf2)',
            border: `2px solid ${i < value.length ? 'var(--gold)' : 'rgba(255,255,255,.12)'}`,
            transition: 'all .12s',
          }} />
        ))}
      </div>
      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
        {digits.map((d, i) => {
          if (d === null) return <div key={i} />;
          const isDel = d === '⌫';
          return (
            <button key={i} type="button" onClick={() => tap(isDel ? '⌫' : String(d))}
              style={{
                height:50, borderRadius:11,
                border: isDel ? '1px solid rgba(255,45,45,.25)' : '1px solid var(--border)',
                background: isDel ? 'rgba(255,45,45,.08)' : 'var(--surf2)',
                color: isDel ? 'var(--red)' : 'var(--text)',
                fontSize: isDel ? '1.2rem' : '1.3rem', fontWeight:700,
                fontFamily:"'Nunito',sans-serif",
                cursor:'pointer', touchAction:'manipulation',
                WebkitTapHighlightColor:'transparent',
              }}
              onPointerDown={e => e.currentTarget.style.transform='scale(.88)'}
              onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
              onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}
            >{d}</button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileModal({ onClose }) {
  const { state, myId } = useGame();
  const me = state.players[myId];

  const [name,    setName]    = useState(me?.name   || '');
  const [status,  setStatus]  = useState(me?.status || '');
  const [pin,     setPin]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const boxRef = useRef(null);

  useEffect(() => {
    // Always start at top when modal opens
    if (boxRef.current) boxRef.current.scrollTop = 0;
  }, []);

  const pinChanged = pin.length === 4;
  const hasPin     = !!me?.pinHash;

  useEffect(() => {
    setName(me?.name || '');
    setStatus(me?.status || '');
  }, [me?.name, me?.status]);

  if (!me) return null;


  async function handlePhotoUpload(e) {
    const f = e.target.files[0]; if (!f) return;
    const photo = await compressPhoto(f);
    await update(ref(db, `fitrace/players/${myId}`), { photo });
    e.target.value = '';
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const upd = {
      name:   name.trim(),
      status: status.trim() || null,
    };
    if (pinChanged) {
      upd.pinHash = hashPin(pin);
      // Save to localStorage so this device stays logged in
      localStorage.setItem(`auth_${myId}`, hashPin(pin));
    }
    await update(ref(db, `fitrace/players/${myId}`), upd);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="profile-box" ref={boxRef} onClick={e => e.stopPropagation()}
        style={{ maxHeight:'90vh', overflowY:'auto' }}>

        {/* Avatar */}
        <div className="profile-av-wrap" onClick={() => document.getElementById('pf-photo').click()}>
          <Avatar player={me} size={100} style={{ border:`3px solid var(--gold)` }} />
          <div className="profile-av-edit">📷</div>
        </div>
        <input id="pf-photo" type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoUpload} />

        <div className="profile-name" style={{ color:me.color }}>{me.name}</div>
        {/* Achievement stickers */}
        <AchievementBadges achievements={me.achievements || {}} size={32} />



        {/* Edit fields */}
        <div style={{ width:'100%', marginTop:14, textAlign:'left' }}>
          <div className="form-label" style={{ marginBottom:6 }}>Имя</div>
          <input className="form-input" style={{ marginBottom:10 }}
            maxLength={18} value={name} onChange={e => setName(e.target.value)} />

          <div className="form-label" style={{ marginBottom:6 }}>Девиз</div>
          <input className="form-input" style={{ marginBottom:16 }}
            maxLength={40} value={status} onChange={e => setStatus(e.target.value)}
            placeholder="Твой девиз Чада..." />

          {/* PIN section */}
          <div style={{
            borderTop:'1px solid var(--border)', paddingTop:14, marginBottom:14,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{
                fontFamily:"'Oswald',sans-serif", fontSize:'.75rem', fontWeight:700,
                color:'var(--dim)', textTransform:'uppercase', letterSpacing:1.5,
              }}>
                🔐 PIN-код
              </div>
              {hasPin && (
                <span style={{
                  background:'rgba(57,255,20,.1)', border:'1px solid rgba(57,255,20,.25)',
                  borderRadius:20, padding:'2px 8px',
                  fontSize:'.65rem', fontWeight:800, color:'var(--green)',
                  fontFamily:"'Oswald',sans-serif",
                }}>
                  ✓ установлен
                </span>
              )}
              {!hasPin && (
                <span style={{
                  background:'rgba(255,45,45,.1)', border:'1px solid rgba(255,45,45,.25)',
                  borderRadius:20, padding:'2px 8px',
                  fontSize:'.65rem', fontWeight:800, color:'var(--red)',
                  fontFamily:"'Oswald',sans-serif",
                }}>
                  не задан
                </span>
              )}
            </div>

            <PinPad
              value={pin}
              onChange={setPin}
              label={hasPin ? 'Новый PIN (оставь пустым чтобы не менять)' : 'Задать PIN из 4 цифр'}
            />

            {pinChanged && (
              <div style={{
                fontSize:'.78rem', color:'var(--gold)', fontWeight:800,
                fontFamily:"'Oswald',sans-serif", textAlign:'center',
                marginBottom:8,
              }}>
                ✅ Новый PIN готов к сохранению
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={save}
            disabled={saving || !name.trim()}
            style={{ marginBottom:8 }}>
            {saved ? '✅ Сохранено!' : saving ? 'Сохраняем...' : 'Сохранить 💾'}
          </button>
        </div>

        <button className="btn-profile-close" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
}
