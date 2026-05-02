export const ACHIEVEMENTS = [
  { id:'first_workout', icon:'🐣', name:'Первый шаг',      desc:'Первая тренировка. Диван отпустил.' },
  { id:'streak_7',      icon:'💎', name:'Железный',         desc:'7 дней подряд без пропуска.' },
  { id:'streak_14',     icon:'⚡', name:'Сигма-машина',     desc:'14 дней подряд. Ты не человек.' },
  { id:'streak_30',     icon:'👑', name:'Легенда',          desc:'30 дней подряд. Памятник заслужен.' },
  { id:'pullups_500',   icon:'🏋️', name:'Подтяжник',       desc:'500 подтягиваний суммарно.' },
  { id:'pushups_1000',  icon:'💪', name:'Отжиматель',       desc:'1000 отжиманий суммарно.' },
  { id:'run_50km',      icon:'🏃', name:'Форест Гамп',      desc:'50 км суммарно. Просто бежал.' },
  { id:'plank_60min',   icon:'🧱', name:'Планкер',          desc:'60 минут планки суммарно.' },
  { id:'all_exercises', icon:'🎯', name:'Всё сразу',        desc:'Все 5 упражнений за один день.' },
  { id:'week_winner',   icon:'🥇', name:'Победитель',       desc:'Выиграл недельное соревнование.' },
  { id:'week_winner_2', icon:'🔥', name:'Дважды Чад',       desc:'Выиграл 2 недели.' },
  { id:'week_winner_3', icon:'🛡️', name:'Несломленный',    desc:'Выиграл 3 недели подряд.' },
  { id:'comeback',      icon:'🚀', name:'Comeback',          desc:'Был последним — стал первым за неделю.' },
  { id:'overtake_3',    icon:'😤', name:'Обгонщик',         desc:'Обогнал 3 человек за один день.' },
  { id:'wine_5',        icon:'🍷', name:'Культурный',       desc:'Выбирал вино 5 раз. Учёные одобряют.' },
  { id:'beer_3',        icon:'🍺', name:'Скуф-классик',     desc:'Записал пиво 3 раза. Классика жанра.' },
  { id:'first_alco',    icon:'🤝', name:'Признался',        desc:'Первый раз добавил алкоголь. Честность — сила.' },
  { id:'sober_week',    icon:'🧃', name:'Трезвенник',       desc:'Неделя без алкоголя. Подозрительно.' },
  { id:'lazy_3days',    icon:'🛋️', name:'Диванный атлет',  desc:'3 дня без тренировки. Диван рад.' },
  { id:'last_place_2',  icon:'🥔', name:'Главный скуф',     desc:'Последнее место 2 недели подряд.' },
  { id:'alco_no_workout',icon:'📺',name:'Любитель пресса',  desc:'Алкоголь в день без тренировки.' },
  { id:'early_bird',    icon:'🌅', name:'Ранняя пташка',    desc:'Тренировка до 8 утра. Героизм.' },
  { id:'night_owl',     icon:'🌙', name:'Полуночник',       desc:'Тренировка после 23:00.' },
  { id:'weight_tracker',icon:'✍️', name:'Честный скуф',    desc:'Добавлял вес 4 недели подряд.' },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

export function checkAchievements(player, daily, myId, existingIds = []) {
  const earned  = new Set(existingIds);
  const newOnes = [];

  function give(id) {
    if (!earned.has(id)) { earned.add(id); newOnes.push(id); }
  }

  const streak = player.streak || 0;
  const steps  = player.steps  || 0;

  // Cumulative totals
  const totals = { pullups:0, pushups:0, dips:0, squats:0, abs:0, run_km:0, beer:0, wine:0, spirit:0 };
  Object.values(daily || {}).forEach(dayData => {
    const d = dayData[myId]; if (!d) return;
    Object.keys(totals).forEach(k => { totals[k] += d[k] || 0; });
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayD   = daily?.[todayStr]?.[myId] || {};

  // Workout
  if (steps > 0)    give('first_workout');
  if (streak >= 7)  give('streak_7');
  if (streak >= 14) give('streak_14');
  if (streak >= 30) give('streak_30');

  // Cumulative
  if (totals.pullups >= 500)  give('pullups_500');
  if (totals.pushups >= 1000) give('pushups_1000');
  if (totals.run_km >= 50)    give('run_50km');
  if (totals.abs >= 60)       give('plank_60min');

  // All exercises in one day
  const exToday = ['pullups','pushups','dips','squats','abs'].filter(k => (todayD[k]||0) > 0).length;
  if (exToday >= 5) give('all_exercises');

  // Alcohol
  if ((totals.beer + totals.wine + totals.spirit) >= 1) give('first_alco');
  if (totals.wine >= 5) give('wine_5');
  if (totals.beer >= 3) give('beer_3');

  // Alco without workout
  const drankToday  = (todayD.beer||0)+(todayD.wine||0)+(todayD.spirit||0) > 0;
  const workedToday = ['pullups','pushups','dips','squats','abs','run_km'].some(k => (todayD[k]||0) > 0);
  if (drankToday && !workedToday) give('alco_no_workout');

  // Lazy
  const daysSince = player.lastActiveDate
    ? Math.floor((Date.now() - new Date(player.lastActiveDate)) / 86400000) : 999;
  if (daysSince >= 3) give('lazy_3days');

  // Time-based
  const h = new Date().getHours();
  if (h < 8)  give('early_bird');
  if (h >= 23) give('night_owl');

  return newOnes;
}

// Check week-result achievements (called on week reset)
export function checkWeekAchievements(winnerId, loserId, players) {
  const results = {}; // { playerId: [newAchievementIds] }

  Object.entries(players).forEach(([id, p]) => {
    const existing = Object.keys(p.achievements || {});
    const earned = new Set(existing);
    const newOnes = [];
    function give(aid) {
      if (!earned.has(aid)) { earned.add(aid); newOnes.push(aid); }
    }

    if (id === winnerId) {
      give('week_winner');
      const wins = Object.keys(p.achievements || {}).filter(a => a === 'week_winner').length + 1;
      if (wins >= 2) give('week_winner_2');
      if (wins >= 3) give('week_winner_3');
    }

    if (newOnes.length > 0) results[id] = newOnes;
  });

  return results;
}
