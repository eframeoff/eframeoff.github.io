import { useState } from "react";
import { useGame } from "../GameContext.jsx";

function timeAgoShort(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "только что";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return `${Math.floor(diff / 86400000)} д назад`;
}

// Funny text generators per event type
function buildText(e, players) {
  const color = players[e.uid]?.color || "#FFB800";

  if (e.type === "overtake") {
    const MSGS = [
      () => `${e.actor} обогнал ${e.target}! Слышишь топот?`,
      () => `${e.target} смотрит в спину ${e.actor}. Привет, скуф!`,
      () => `${e.actor} вырвался вперёд. ${e.target} в шоке.`,
      () => `${e.target} теперь позади. ${e.actor} не оглядывается.`,
      () => `${e.actor} промчался мимо ${e.target}. Пыль и позор.`,
    ];
    const msg = MSGS[Math.abs(e.ts || 0) % MSGS.length]();
    return { icon: "😤", text: msg, color: "#FF6B00" };
  }

  if (e.alco) {
    if (e.alco === "beer")
      return {
        icon: "🍺",
        text: `${e.name} признался — пил пиво. −20 очков. Диван доволен.`,
        color: "#FF4444",
      };
    if (e.alco === "spirit")
      return {
        icon: "🥃",
        text: `${e.name}... крепенькое. −30 очков. Серьёзно, ${e.name}?`,
        color: "#FF4444",
      };
    if (e.alco === "wine")
      return {
        icon: "🍷",
        text: `${e.name} культурно выпил вино. +10 очков 😂 Учёные одобряют.`,
        color: "#39FF14",
      };
  }

  // Workout — pick funny text based on what was done
  const parts = [];
  if (e.pullups) parts.push(`${e.pullups} подтяг`);
  if (e.pushups) parts.push(`${e.pushups} отжим`);
  if (e.dips) parts.push(`${e.dips} брусьев`);
  if (e.squats) parts.push(`${e.squats} присед`);
  if (e.abs) parts.push(`${e.abs} мин планки`);
  if (e.run_km) parts.push(`${e.run_km} км`);

  if (parts.length === 0) return null;

  const totalPts = e.pts || 0;
  const WORKOUT_MSGS = [
    () =>
      `${e.name} влил ${parts.join(", ")}. +${totalPts} очков. Диван пустует.`,
    () => `${e.name} потренировался: ${parts.join(", ")}. Лето доволено.`,
    () => `${parts.join(", ")} — это ${e.name}. +${totalPts} очков Чадизма.`,
    () => `${e.name} сделал ${parts.join(", ")}. Мышцы в шоке, но благодарны.`,
    () => `${totalPts} очков от ${e.name}! (${parts.join(", ")})`,
  ];

  // Extra funny comment for big sessions
  let icon = "💪";
  let suffix = "";
  if (totalPts >= 150) {
    icon = "🔥";
    suffix = " Подозрительно много.";
  } else if (totalPts >= 80) {
    icon = "💥";
    suffix = " Серьёзный пацан.";
  } else if (e.run_km >= 5) {
    icon = "🏃";
    suffix = " Бежал не останавливаясь.";
  } else if (e.pullups >= 20) {
    icon = "🏋️";
    suffix = " Подтягивается как машина.";
  }

  const msg =
    WORKOUT_MSGS[Math.abs(e.ts || 0) % WORKOUT_MSGS.length]() + suffix;
  return { icon, text: msg, color };
}

export default function EventFeed() {
  const { state } = useGame();

  const cutoff = Date.now() - 3 * 24 * 3600000;
  const entries = Object.entries(state.activityLog || {})
    .map(([k, v]) => ({ key: k, ...v }))
    .filter((e) => (e.ts || 0) > cutoff)
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 30);

  if (entries.length === 0)
    return (
      <div
        style={{
          padding: "10px 0 2px",
          textAlign: "center",
          color: "rgba(255,255,255,.2)",
          fontFamily: "'Oswald',sans-serif",
          fontSize: ".7rem",
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Пока тишина. Идите тренироваться 🛋️
      </div>
    );

  return (
    <div style={{ width: "100%", maxHeight: 200, overflowY: "auto" }}>
      {entries
        .map((e) => {
          const built = buildText(e, state.players);
          if (!built) return null;
          const { icon, text, color } = built;
          return (
            <div
              key={e.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 0",
                borderBottom: "1px solid rgba(255,255,255,.04)",
              }}
            >
              <span style={{ fontSize: ".95rem", flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,.75)",
                    lineHeight: 1.3,
                  }}
                >
                  {text}
                </span>
              </div>
              <span
                style={{
                  fontSize: ".6rem",
                  color: "rgba(255,255,255,.3)",
                  fontWeight: 700,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {timeAgoShort(e.ts)}
              </span>
            </div>
          );
        })
        .filter(Boolean)}
    </div>
  );
}
