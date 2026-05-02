import { useState } from 'react';
import { ref, set, update } from 'firebase/database';
import { db } from '../firebase.js';
import { useGame } from '../GameContext.jsx';
import { COLORS, MAX_PLAYERS } from '../constants.js';
import { compressPhoto } from '../utils.js';

// PIN stored as hash (simple — not cryptographic, just obscured)
function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h) + pin.charCodeAt(i);
  return (h >>> 0).toString(16);
}

// PIN pad — 4 big buttons, mobile-friendly
function PinPad({ value, onChange, label }) {
  const digits = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];
  function tap(d) {
    if (d === '⌫') { onChange(value.slice(0,-1)); return; }
    if (value.length >= 4) return;
    onChange(value + d);
  }
  return (
    <div style={{ marginBottom:18 }}>
      <div className="form-label" style={{ marginBottom:10 }}>{label}</div>

      {/* Dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:14, height:14, borderRadius:'50%',
            background: i < value.length ? 'var(--gold)' : 'var(--surf2)',
            border:`2px solid ${i < value.length ? 'var(--gold)' : 'rgba(255,255,255,.12)'}`,
            transition:'all .12s',
          }} />
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {digits.map((d, i) => {
          if (d === null) return <div key={i} />;
          const isDel = d === '⌫';
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(isDel ? '⌫' : String(d))}
              style={{
                height:54, borderRadius:12,
                border: isDel ? '1px solid rgba(255,45,45,.25)' : '1px solid var(--border)',
                background: isDel ? 'rgba(255,45,45,.08)' : 'var(--surf2)',
                color: isDel ? 'var(--red)' : 'var(--text)',
                fontSize: isDel ? '1.3rem' : '1.4rem', fontWeight:700,
                fontFamily:"'Nunito',sans-serif",
                cursor:'pointer', touchAction:'manipulation',
                WebkitTapHighlightColor:'transparent',
                transition:'transform .08s',
              }}
              onPointerDown={e => e.currentTarget.style.transform='scale(.88)'}
              onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
              onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CreateScreen({ onBack, onCreated, editingId = null }) {
  const { state, selectPlayer } = useGame();
  const editing = editingId ? state.players[editingId] : null;

  const [name,   setName]   = useState(editing?.name   || '');
  const [status, setStatus] = useState(editing?.status || '');
  const [photo,  setPhoto]  = useState(null);
  const [pin,    setPin]    = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handlePhotoChange(e) {
    const f = e.target.files[0]; if (!f) return;
    setPhoto(await compressPhoto(f));
    e.target.value = '';
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Введи имя!'); return; }
    if (!editingId && pin.length !== 4) { setError('Нужен PIN из 4 цифр'); return; }
    setError(''); setSaving(true);
    try {
      if (editingId) {
        const upd = {
          name: name.trim(),
          status: status.trim() || null,
          photo: photo || editing?.photo || null,
        };
        // Only update PIN if user entered a new one
        if (pin.length === 4) upd.pinHash = hashPin(pin);
        await update(ref(db, `fitrace/players/${editingId}`), upd);
        // Save to localStorage so they stay logged in
        localStorage.setItem(`auth_${editingId}`, hashPin(pin.length === 4 ? pin : '____'));
        onCreated(editingId);
      } else {
        if (Object.keys(state.players).length >= MAX_PLAYERS) return;
        const usedColors = Object.values(state.players).map(p => p.color);
        const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[0];
        const id = 'p_' + Date.now();
        await set(ref(db, `fitrace/players/${id}`), {
          name: name.trim(), status: status.trim() || null,
          photo: photo || null, pinHash: hashPin(pin),
          steps: 0, color, streak: 0,
          lastActiveDate: '', createdAt: Date.now(),
        });
        // Auto-login on this device
        localStorage.setItem(`auth_${id}`, hashPin(pin));
        selectPlayer(id);
        onCreated(id);
      }
    } finally { setSaving(false); }
  }

  const previewSrc = photo || editing?.photo;
  const canSubmit  = name.trim() && (editingId || pin.length === 4);

  return (
    <div style={{ maxWidth:460, margin:'0 auto', padding:'0 20px 60px' }}>
      <div style={{ textAlign:'center', padding:'28px 0 14px' }}>
        <div className="game-logo">WANTTO<span className="logo-sub">BEGIGACHAD</span></div>
      </div>

      <button className="back-btn" onClick={onBack}>← Назад</button>

      <div className="form-card">
        <div className="form-title" style={{ color:'var(--gold)' }}>
          {editingId ? 'Редактировать' : 'Создать Чада'}
        </div>

        {/* Photo */}
        <div className="photo-upload-area">
          <div className="photo-preview" onClick={() => document.getElementById('photo-file').click()}>
            {previewSrc
              ? <img src={previewSrc} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
              : <span>💪</span>
            }
          </div>
          <div className="photo-upload-btn" onClick={() => document.getElementById('photo-file').click()}>
            Загрузить фото
          </div>
          <input id="photo-file" type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
        </div>

        {/* Name */}
        <div className="form-group">
          <label className="form-label">Имя (позывной)</label>
          <input className="form-input" placeholder="Как тебя звать, скуф?"
            maxLength={18} value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label">Статус / девиз</label>
          <input className="form-input" placeholder="Например: Качаюсь к пляжу 🏖️"
            maxLength={40} value={status} onChange={e => setStatus(e.target.value)} />
          <div className="char-count">{status.length}/40</div>
        </div>

        {/* PIN */}
        <PinPad
          value={pin}
          onChange={setPin}
          label={editingId ? 'Новый PIN (оставь пустым чтобы не менять)' : 'Придумай PIN-код 🔐'}
        />

        {error && (
          <div style={{ color:'var(--red)', fontSize:'.82rem', fontWeight:800, marginBottom:10, textAlign:'center' }}>
            {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={saving || !canSubmit}>
          {saving ? 'Сохраняем...' : editingId ? 'Сохранить 💾' : 'Стать Чадом! 💪'}
        </button>
      </div>
    </div>
  );
}
