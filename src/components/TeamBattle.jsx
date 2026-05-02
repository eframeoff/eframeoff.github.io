import { useState, useEffect } from 'react';
import { ref, update, set } from 'firebase/database';
import { db } from '../firebase.js';
import { useGame } from '../GameContext.jsx';
import { isoWeek } from '../utils.js';

// ── Random team names pool ────────────────────────────────────────
const TEAM_NAME_SUGGESTIONS = [
  'Железные Скуфы', 'Диванные Атлеты', 'Берсерки Лета', 'Кефирная Братва',
  'Протеиновые Орлы', 'Качки с Района', 'Легион Боли', 'Солёные Огурцы',
  'Пресс-конференция', 'Бицепс и Ко', 'Горячие Штанги', 'Армия Чадов',
  'Скуфы в Деле', 'Боевые Хомяки', 'Турник и Плов', 'Ночные Отжималы',
  'Суровые Парни', 'Атлеты с Дивана', 'Три Мушкетёра', 'Дикие Гантели',
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Shuffle and split into teams of 3 ────────────────────────────
function makeTeams(playerIds) {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const teams = [];
  for (let i = 0; i < shuffled.length; i += 3) {
    teams.push(shuffled.slice(i, i + 3));
  }
  return teams;
}

// ── Mini avatars row (3 small circles) ───────────────────────────
function TeamAvatars({ playerIds, players }) {
  return (
    <div style={{ display: 'flex', marginRight: 4 }}>
      {playerIds.slice(0, 3).map((id, i) => {
        const p = players[id];
        if (!p) return null;
        return (
          <div key={id} style={{
            width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${p.color}`,
            marginLeft: i === 0 ? 0 : -8,
            zIndex: 3 - i,
            position: 'relative',
            background: p.color + '22',
          }}>
            {p.photo
              ? <img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.65rem', fontWeight: 900, color: p.color,
                }}>
                  {(p.name || '?')[0].toUpperCase()}
                </div>
            }
          </div>
        );
      })}
    </div>
  );
}

// ── Name proposal modal ───────────────────────────────────────────
function NameModal({ teamIdx, suggestion, onSubmit, onClose }) {
  const [name, setName] = useState(suggestion);
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ border: '1px solid var(--gold)' }}>
        <div style={{
          fontFamily: "'Press Start 2P',monospace", fontSize: '.52rem',
          color: 'var(--gold)', letterSpacing: 2, marginBottom: 12,
        }}>ТЫ ВЫБРАН!</div>
        <div style={{
          fontFamily: "'Oswald',sans-serif", fontSize: '.88rem',
          color: 'var(--dim)', marginBottom: 16, lineHeight: 1.5,
        }}>
          Придумай название для своей команды на эту неделю.<br/>
          Или возьми случайное:
        </div>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={24}
          style={{ marginBottom: 8, textAlign: 'center' }}
          autoFocus
        />
        <button
          onClick={() => setName(getRandom(TEAM_NAME_SUGGESTIONS))}
          style={{
            width: '100%', padding: '8px', marginBottom: 14,
            background: 'var(--surf2)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--dim)',
            fontFamily: "'Oswald',sans-serif", fontSize: '.82rem',
            fontWeight: 700, cursor: 'pointer',
          }}
        >🎲 Случайное название</button>
        <button
          className="btn-primary"
          onClick={() => name.trim() && onSubmit(name.trim())}
          disabled={!name.trim()}
        >
          Утвердить! 💪
        </button>
        <br />
        <button className="m-cancel" onClick={onClose} style={{ marginTop: 10 }}>Позже</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function TeamBattle() {
  const { state, myId } = useGame();
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingTeamIdx, setPendingTeamIdx] = useState(null);

  const currentWeek = isoWeek();
  const teamsData   = state.teams || {};
  const weekTeams   = teamsData[currentWeek] || null;
  const players     = state.players;
  const playerIds   = Object.keys(players);

  // Check if teams need to be created for this week
  const needsInit = !weekTeams && playerIds.length >= 2;

  // Initialize teams for the week (only once, first player to open triggers it)
  useEffect(() => {
    if (!needsInit || !myId) return;
    // Avoid race: only the player with the lexicographically smallest ID initializes
    const sorted = [...playerIds].sort();
    if (sorted[0] !== myId) return;

    const teamArrays = makeTeams(playerIds);
    const teams = teamArrays.map((members, i) => ({
      name: null,           // to be named by a member
      members,
      namerId: members[0],  // first member is asked to name the team
      namedAt: null,
    }));

    set(ref(db, `fitrace/teams/${currentWeek}`), teams);
  }, [needsInit, myId]);

  // Check if I need to name my team
  useEffect(() => {
    if (!weekTeams || !myId) return;
    const myTeamIdx = weekTeams.findIndex(t => t.members?.includes(myId));
    if (myTeamIdx === -1) return;
    const myTeam = weekTeams[myTeamIdx];
    if (myTeam.namerId === myId && !myTeam.name) {
      // Small delay so it doesn't pop immediately on load
      const t = setTimeout(() => {
        setShowNameModal(true);
        setPendingTeamIdx(myTeamIdx);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [weekTeams, myId]);

  async function submitTeamName(name) {
    await update(ref(db, `fitrace/teams/${currentWeek}/${pendingTeamIdx}`), {
      name,
      namedAt: Date.now(),
    });
    setShowNameModal(false);
    setPendingTeamIdx(null);
  }

  if (!weekTeams || weekTeams.length === 0) return null;

  // Calculate team scores
  const teamsWithScores = weekTeams.map((team, idx) => {
    const members = team.members || [];
    const totalPts = members.reduce((sum, id) => sum + (players[id]?.steps || 0), 0);
    return { ...team, idx, totalPts };
  });

  const sorted  = [...teamsWithScores].sort((a, b) => b.totalPts - a.totalPts);
  const maxPts  = Math.max(...sorted.map(t => t.totalPts), 1);
  const rankEmoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  // Team colors — cycle through player colors or fixed set
  const TEAM_COLORS = ['#FFB800', '#00CFFF', '#FF5E5B', '#39FF14', '#FF69B4'];

  return (
    <>
      <div style={{
        background: 'var(--surf)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '18px 16px',
        marginBottom: 14,
      }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif", fontSize: '.72rem',
          fontWeight: 700, color: 'var(--dim)',
          textTransform: 'uppercase', letterSpacing: 2,
          marginBottom: 14,
        }}>
          ⚡ Командный зачёт — эта неделя
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sorted.map((team, rank) => {
            const color    = TEAM_COLORS[team.idx % TEAM_COLORS.length];
            const pct      = maxPts > 0 ? (team.totalPts / maxPts) * 100 : 0;
            const isMyTeam = team.members?.includes(myId);
            const teamName = team.name || '(без названия)';

            return (
              <div key={team.idx} style={{
                background: isMyTeam ? `${color}0D` : 'transparent',
                border: isMyTeam ? `1px solid ${color}33` : '1px solid transparent',
                borderRadius: 12, padding: isMyTeam ? '10px 12px' : '4px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {/* Rank */}
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{rankEmoji[rank]}</span>

                  {/* Mini avatars */}
                  <TeamAvatars playerIds={team.members || []} players={players} />

                  {/* Team name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Oswald',sans-serif", fontSize: '.88rem',
                      fontWeight: 700, color: isMyTeam ? color : 'var(--text)',
                      textTransform: 'uppercase', letterSpacing: .5,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {teamName}
                      {isMyTeam && <span style={{ color: color, fontSize: '.65rem', marginLeft: 6 }}>← ты</span>}
                    </div>
                    <div style={{
                      fontFamily: "'Oswald',sans-serif", fontSize: '.68rem',
                      color: 'var(--dim)', marginTop: 1,
                    }}>
                      {(team.members || []).map(id => players[id]?.name || '?').join(' · ')}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{
                    fontFamily: "'Press Start 2P',monospace",
                    fontSize: '.6rem', color,
                    flexShrink: 0,
                  }}>{team.totalPts}</div>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: 6, borderRadius: 3,
                  background: 'rgba(255,255,255,.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${pct.toFixed(1)}%`,
                    background: rank === 0
                      ? `linear-gradient(90deg, ${color}, #fff8)`
                      : color,
                    transition: 'width 1s ease',
                    boxShadow: rank === 0 ? `0 0 8px ${color}88` : 'none',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Name modal */}
      {showNameModal && pendingTeamIdx !== null && (
        <NameModal
          teamIdx={pendingTeamIdx}
          suggestion={getRandom(TEAM_NAME_SUGGESTIONS)}
          onSubmit={submitTeamName}
          onClose={() => setShowNameModal(false)}
        />
      )}
    </>
  );
}
