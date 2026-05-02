import { useState } from 'react';

const VERSIONS = [
  {
    version: '1.1',
    date: 'Май 2026',
    emoji: '🔥',
    changes: [
      '🏆 Ачивки — 24 достижения в виде стикеров на профиле',
      '📰 Лента последних событий на главном экране',
      '📋 История тренировок в чате (вкладка «История трень»)',
      '⚖️ Трекер веса с графиком (кто худеет, кто толстеет)',
      '⚡ Командный зачёт — случайные команды каждую неделю',
      '🍺 Алко-трекер — пиво, крепкое, вино (вино +10 очков 😂)',
      '🔥 Пресс и Планка — новые упражнения',
      '🏃 Бег добавлен в кардио',
      '🥇 Зал Чадов прошедшей недели',
      '💬 Чат — общая переписка в реальном времени',
    ],
  },
  {
    version: '1.0',
    date: 'Апрель 2026',
    emoji: '🐣',
    changes: [
      '🏃 Гонка — человечки бегут по треку',
      '💪 Упражнения — подтягивания, отжимания, брусья, приседания',
      '👤 Персонажи — создание с фото и девизом',
      '🔐 PIN-авторизация',
      '📊 Статистика за день и неделю',
      '🥔 Доска позора — кто не тренировался',
      '🔥 Стрики — дни подряд',
      '🎲 Случайные события (1% шанс)',
      '🎉 Юбилейные очки — попапы с картинками',
      '👑 Еженедельный сброс и победитель',
    ],
  },
];

export default function VersionModal() {
  const [open, setOpen] = useState(false);
  const latest = VERSIONS[0];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: '5px 12px',
          color: 'rgba(255,255,255,.25)',
          fontFamily: "'Oswald',sans-serif",
          fontSize: '.65rem',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: 1,
          transition: 'all .2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,184,0,.3)';
          e.currentTarget.style.color = 'rgba(255,184,0,.6)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,.25)';
        }}
      >
        🥔 Скуфо-версия {latest.version}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="modal-overlay show"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              border: '1px solid var(--gold)',
              maxWidth: 440,
              maxHeight: '85vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 0,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 22px 16px',
              borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0,
              background: 'var(--surf)',
              zIndex: 1,
            }}>
              <div style={{
                fontFamily: "'Press Start 2P',monospace",
                fontSize: '.6rem', color: 'var(--gold)',
                letterSpacing: 2, marginBottom: 4,
              }}>🥔 СКУФО-ВЕРСИЯ</div>
              <div style={{
                fontFamily: "'Oswald',sans-serif",
                fontSize: '.72rem', color: 'var(--dim)',
                fontWeight: 700,
              }}>История обновлений WantToBeGigaChad</div>
            </div>

            {/* Version list */}
            <div style={{ padding: '8px 0 16px' }}>
              {VERSIONS.map((v, vi) => (
                <div key={v.version} style={{
                  padding: '14px 22px',
                  borderBottom: vi < VERSIONS.length - 1
                    ? '1px solid var(--border)' : 'none',
                }}>
                  {/* Version header */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 10, marginBottom: 12,
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{v.emoji}</span>
                    <div>
                      <div style={{
                        fontFamily: "'Oswald',sans-serif",
                        fontSize: '1rem', fontWeight: 700,
                        color: vi === 0 ? 'var(--gold)' : 'var(--text)',
                        textTransform: 'uppercase', letterSpacing: .5,
                      }}>
                        Скуфо-версия {v.version}
                        {vi === 0 && (
                          <span style={{
                            marginLeft: 8,
                            background: 'var(--gold)',
                            color: '#09070B',
                            borderRadius: 20,
                            padding: '1px 8px',
                            fontSize: '.6rem',
                            fontWeight: 900,
                          }}>ТЕКУЩАЯ</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '.68rem', color: 'var(--dim)',
                        fontWeight: 700, marginTop: 1,
                      }}>{v.date}</div>
                    </div>
                  </div>

                  {/* Changes list */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {v.changes.map((c, i) => (
                      <div key={i} style={{
                        fontSize: '.8rem', fontWeight: 700,
                        color: 'rgba(255,255,255,.7)',
                        lineHeight: 1.4,
                        paddingLeft: 4,
                      }}>{c}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 22px 16px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '.68rem', color: 'var(--dim)',
                fontWeight: 700, marginBottom: 12,
                fontStyle: 'italic',
              }}>
                Сделано с 💪 и большим количеством протеина
              </div>
              <button
                className="btn-primary"
                onClick={() => setOpen(false)}
                style={{ maxWidth: 200 }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
