const BASE = import.meta.env.VITE_NOTIFY_URL || '';

async function send(payload) {
  try {
    await fetch(`${BASE}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Notify failed:', e);
  }
}

export const notify = {
  workout:   (actor, pts, exercises, km)      => send({ type:'workout',  actor, pts, exercises, km: km||0 }),
  overtake:  (actor, target)                  => send({ type:'overtake', actor, target }),
  milestone: (actor, pts)                     => send({ type:'milestone',actor, pts }),
  weekEnd:   (actor, pts, loserName)          => send({ type:'week_end', actor, pts, target: loserName||null }),
};
