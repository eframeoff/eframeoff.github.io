import { CHAD_LEVELS } from './constants.js';

export function isoWeek(d = new Date()) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7));
  const y = new Date(dt.getFullYear(), 0, 1);
  const w = Math.ceil((((dt - y) / 86400000) + 1) / 7);
  return `${dt.getFullYear()}-W${String(w).padStart(2, '0')}`;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysUntilSummer() {
  const now = new Date(), y = now.getFullYear();
  let summer = new Date(y, 5, 1);
  if (now >= summer) summer = new Date(y + 1, 5, 1);
  return Math.ceil((summer - now) / 86400000);
}

export function untilMonday() {
  const now = new Date(), day = now.getDay(), days = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + days);
  next.setHours(0, 0, 0, 0);
  const diff = next - now;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}д ${h}ч ${m}м`;
}

export function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000)    return 'только что';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}м назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}ч назад`;
  return `${Math.floor(diff / 86400000)}д назад`;
}

export function isOnline(ts) {
  return ts && (Date.now() - ts) < 5 * 60 * 1000;
}

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function chadLevel(steps = 0) {
  return CHAD_LEVELS.find(l => steps >= l.min && steps <= l.max) || CHAD_LEVELS[0];
}

export function chadProgress(steps = 0) {
  const l = chadLevel(steps);
  if (l.max === Infinity) return 100;
  return Math.round(((steps - l.min) / (l.max - l.min + 1)) * 100);
}

export function nextLevel(steps = 0) {
  const i = CHAD_LEVELS.findIndex(l => steps >= l.min && steps <= l.max);
  return CHAD_LEVELS[i + 1] || null;
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function compressPhoto(file) {
  return new Promise(resolve => {
    const img = new Image(), c = document.createElement('canvas');
    img.onload = () => {
      const sz = 96;
      c.width = c.height = sz;
      const ctx = c.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, sz, sz);
      resolve(c.toDataURL('image/jpeg', 0.62));
    };
    img.src = URL.createObjectURL(file);
  });
}

export function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getMilestoneKey(myId) {
  return `shown_ms_${myId}_${todayStr()}`;
}
