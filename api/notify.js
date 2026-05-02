// api/notify.js — Vercel Serverless Function

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID        = process.env.TELEGRAM_CHAT_ID;
const TG             = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

function esc(t = '') {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildMessage({ type, actor, target, pts, km, exercises = {} }) {
  switch (type) {

    case 'workout': {
      const lines = [];
      if (exercises.pullups) lines.push(`🏋️ Подтягивания: ${exercises.pullups}`);
      if (exercises.pushups) lines.push(`💪 Отжимания: ${exercises.pushups}`);
      if (exercises.dips)    lines.push(`🤸 Брусья: ${exercises.dips}`);
      if (exercises.squats)  lines.push(`🦵 Приседания: ${exercises.squats}`);
      if (exercises.abs)     lines.push(`🧱 Планка: ${exercises.abs * 0.5} мин`);
      if (km)                lines.push(`🏃 Бег: ${km} км`);
      const detail = lines.length ? '\n' + lines.join('\n') : '';
      const quips  = ['Диван официально расстроен.','Лето одобряет.','Мышцы в шоке, но благодарны.','Скуф перестаёт быть скуфом.','Протеин засчитан.'];
      const quip   = quips[Math.floor(Math.random() * quips.length)];
      return `💪 <b>${esc(actor)}</b> потренировался!${detail}\n\n+${pts} очков Чадизма\n<i>${quip}</i>`;
    }

    case 'overtake':
      return `😤 <b>${esc(actor)}</b> обогнал <b>${esc(target)}</b>!\nОтставание растёт, скуф 🏃`;

    case 'milestone': {
      const titles = { 50:'🥔 Встал с дивана!', 100:'💪 Первая сотка!', 200:'🏋️ Входит во вкус!', 300:'😤 Серьёзный пацан!', 500:'👑 Sultan of Gainz!', 1000:'⚡ GIGACHAD DETECTED' };
      return `${titles[pts] || '🏆'}\n<b>${esc(actor)}</b> набрал <b>${pts} очков Чадизма</b> за неделю!`;
    }

    case 'week_end': {
      let msg = `🏆 <b>ИТОГИ НЕДЕЛИ</b>\n\n👑 Победитель: <b>${esc(actor)}</b> — ${pts} очков\n`;
      if (target) msg += `🥔 Главный скуф: <b>${esc(target)}</b>\n`;
      msg += `\nНовая неделя — новые шансы. Или нет. 💀`;
      return msg;
    }

    default: return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });
  if (!TELEGRAM_TOKEN || !CHAT_ID) return res.status(500).json({ error: 'Not configured' });

  try {
    const text = buildMessage(req.body);
    if (!text) return res.status(400).json({ error: 'Unknown event' });
    const r = await fetch(TG, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });
    return res.status(200).json({ ok: true, tg: await r.json() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
