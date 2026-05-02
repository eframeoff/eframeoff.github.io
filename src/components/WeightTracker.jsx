import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase.js';
import { useGame } from '../GameContext.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ── Weight input modal ────────────────────────────────────────────
export function WeightModal({ onClose }) {
  const { state, myId } = useGame();
  const me = state.players[myId];
  const [kg, setKg] = useState('');
  const [saving, setSaving] = useState(false);

  if (!me) return null;

  const log = me.weightLog || {};
  const entries = Object.entries(log).sort();
  const hasData = entries.length > 0;
  const latest = hasData ? entries[entries.length - 1][1] : null;
  const baseWeight = hasData ? entries[0][1] : null;
  const delta = baseWeight && latest ? (latest - baseWeight).toFixed(1) : null;

  async function save() {
    const val = parseFloat(kg.replace(',', '.'));
    if (!val || val < 30 || val > 300) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    await update(ref(db, `fitrace/players/${myId}/weightLog`), { [today]: val });
    setSaving(false);
    setKg('');
    onClose();
  }

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        border: '1px solid var(--gold)',
      }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif", fontSize: '.72rem',
          color: 'var(--dim)', textTransform: 'uppercase',
          letterSpacing: 2, marginBottom: 16,
        }}>⚖️ Взвесился сегодня?</div>

        {/* Current stats */}
        {hasData && (
          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center',
            marginBottom: 18,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Press Start 2P',monospace",
                fontSize: '.7rem', color: 'var(--text)',
              }}>{latest} кг</div>
              <div style={{ fontSize: '.65rem', color: 'var(--dim)', marginTop: 3 }}>сейчас</div>
            </div>
            {delta !== null && (
              <>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'Press Start 2P',monospace",
                    fontSize: '.7rem',
                    color: parseFloat(delta) < 0 ? 'var(--green)' : parseFloat(delta) > 0 ? 'var(--red)' : 'var(--dim)',
                  }}>
                    {parseFloat(delta) > 0 ? '+' : ''}{delta} кг
                  </div>
                  <div style={{ fontSize: '.65rem', color: 'var(--dim)', marginTop: 3 }}>от старта</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Input */}
        <div style={{ marginBottom: 6, fontFamily: "'Oswald',sans-serif", fontSize: '.72rem', color: 'var(--dim)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 1 }}>
          Твой вес сегодня (кг)
        </div>
        <input
          className="form-input"
          type="number"
          placeholder="например: 82.5"
          value={kg}
          onChange={e => setKg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          style={{ marginBottom: 14, textAlign: 'center', fontSize: '1.3rem' }}
          autoFocus
        />
        <button className="btn-primary" onClick={save} disabled={saving || !kg}>
          {saving ? 'Сохраняем...' : 'Записать ⚖️'}
        </button>
        <br />
        <button className="m-cancel" onClick={onClose} style={{ marginTop: 10 }}>
          Отмена
        </button>
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surf)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '.72rem',
      fontFamily: "'Oswald',sans-serif",
    }}>
      <div style={{ color: 'var(--dim)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {parseFloat(p.value) > 0 ? '+' : ''}{parseFloat(p.value).toFixed(1)} кг
        </div>
      ))}
    </div>
  );
}

// ── Main chart component ──────────────────────────────────────────
export default function WeightChart() {
  const { state } = useGame();
  const players = state.players;
  const entries = Object.entries(players);

  // Collect all unique dates across all players
  const allDates = new Set();
  entries.forEach(([, p]) => {
    Object.keys(p.weightLog || {}).forEach(d => allDates.add(d));
  });
  const dates = [...allDates].sort();

  if (dates.length === 0) return null;

  // Build chart data — delta from each player's first measurement
  const chartData = dates.map(date => {
    const point = { date: date.slice(5) }; // show MM-DD
    entries.forEach(([id, p]) => {
      const log = p.weightLog || {};
      const logDates = Object.keys(log).sort();
      if (logDates.length === 0) return;
      const base = log[logDates[0]];
      // Find closest measurement on or before this date
      const available = logDates.filter(d => d <= date);
      if (available.length === 0) return;
      const closest = available[available.length - 1];
      point[id] = parseFloat((log[closest] - base).toFixed(1));
    });
    return point;
  });

  // Only show players who have at least 1 weight entry
  const activePlayers = entries.filter(([, p]) => Object.keys(p.weightLog || {}).length > 0);
  if (activePlayers.length === 0) return null;

  return (
    <div style={{
      background: 'var(--surf)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '18px 16px 12px',
      marginBottom: 14,
    }}>
      <div style={{
        fontFamily: "'Oswald',sans-serif", fontSize: '.72rem',
        fontWeight: 700, color: 'var(--dim)',
        textTransform: 'uppercase', letterSpacing: 2,
        marginBottom: 14,
      }}>
        ⚖️ Кто худеет, кто толстеет
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        {activePlayers.map(([, p]) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--dim)', fontFamily: "'Oswald',sans-serif" }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,.3)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,.3)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,.1)' }}
            tickLine={false}
            tickFormatter={v => (v > 0 ? `+${v}` : v)}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Zero line */}
          <ReferenceLine y={0} stroke="rgba(255,184,0,.3)" strokeDasharray="4 4" />
          {/* Lines per player */}
          {activePlayers.map(([id, p]) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              name={p.name}
              stroke={p.color}
              strokeWidth={2.5}
              dot={{ fill: p.color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Hint */}
      <div style={{
        fontSize: '.68rem', color: 'rgba(255,255,255,.25)',
        textAlign: 'center', marginTop: 8,
        fontFamily: "'Oswald',sans-serif",
      }}>
        Все стартуют с 0 · ниже = похудел · выше = поправился
      </div>
    </div>
  );
}
