import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { db, isConfigured } from './firebase.js';
import { isoWeek } from './utils.js';
import { notify } from './notify.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState({
    players:     {},
    currentWeek: '',
    lastWinner:  null,
    lastLoser:   null,
    daily:       {},
    chat:        {},
    hallOfFame:  {},
    teams:       {},
    activityLog: {},
  });
  const [myId,    setMyId]    = useState(() => localStorage.getItem('fitrace_pid') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready,   setReady]   = useState(false);
  const prevStepsRef = useRef({});

  // Overtake callback — components subscribe to this
  const overtakeHandlers = useRef([]);
  const onOvertake = (fn) => { overtakeHandlers.current.push(fn); return () => { overtakeHandlers.current = overtakeHandlers.current.filter(f => f !== fn); }; };

  useEffect(() => {
    if (!isConfigured()) { setReady(true); return; }

    const gameRef = ref(db, 'fitrace');
    const unsub = onValue(gameRef, snap => {
      const d = snap.val() || {};
      const newPlayers = d.players || {};
      const now = isoWeek();

      // Detect overtakes
      if (myId && Object.keys(prevStepsRef.current).length > 0) {
        const myOld = prevStepsRef.current[myId] || 0;
        const myNew = newPlayers[myId]?.steps || 0;
        if (myOld === myNew) {
          Object.entries(newPlayers).forEach(([id, p]) => {
            if (id === myId) return;
            const oldS = prevStepsRef.current[id] || 0;
            const newS = p.steps || 0;
            if (oldS <= myOld && newS > myOld) {
              overtakeHandlers.current.forEach(fn => fn(p.name, 'overtookMe'));
            }
          });
        }
      }
      Object.entries(newPlayers).forEach(([id, p]) => { prevStepsRef.current[id] = p.steps || 0; });

      // Week reset check
      const dbWeek = d.currentWeek || '';
      if (dbWeek && dbWeek !== now) {
        doWeekReset(newPlayers, dbWeek, now);
      } else if (!dbWeek) {
        set(ref(db, 'fitrace/currentWeek'), now);
      }

      setState({
        players:     newPlayers,
        currentWeek: dbWeek,
        lastWinner:  d.lastWinner  || null,
        lastLoser:   d.lastLoser   || null,
        daily:       d.daily       || {},
        chat:        d.chat        || {},
        hallOfFame:  d.hallOfFame  || {},
        teams:       d.teams       || {},
        activityLog: d.activityLog || {},
      });
      setReady(true);
    });
    return unsub;
  }, [myId]);

  async function doWeekReset(players, oldWeek, newWeek) {
    let winner = null, maxS = 0, loser = null, minS = Infinity;
    Object.entries(players).forEach(([id, p]) => {
      const s = p.steps || 0;
      if (s > maxS) { maxS = s; winner = { id, ...p }; }
      if (s < minS) { minS = s; loser  = { id, ...p }; }
    });
    const upd = { 'fitrace/currentWeek': newWeek };

    if (winner && maxS > 0) {
      const winnerEntry = {
        name:  winner.name,
        steps: maxS,
        photo: winner.photo || null,
        week:  oldWeek,
        ts:    Date.now(),
      };
      upd['fitrace/lastWinner'] = winnerEntry;

      // Append to hall of fame (keep last 20)
      const hallKey = `fitrace/hallOfFame/${Date.now()}`;
      upd[hallKey] = winnerEntry;
    }

    if (loser && winner && loser.id !== winner.id) {
      upd['fitrace/lastLoser'] = { name: loser.name, steps: minS, id: loser.id };
    }

    Object.keys(players).forEach(id => { upd[`fitrace/players/${id}/steps`] = 0; });
    await update(ref(db), upd);

    // Telegram notification
    if (winner && maxS > 0) {
      notify.weekEnd(winner.name, maxS, loser?.name);
    }

    if (winner && maxS > 0) {
      notify.weekEnd(
        winner.name,
        maxS,
        loser && loser.id !== winner.id ? loser.name : null
      );
    }
  }

  function selectPlayer(id) {
    setMyId(id);
    localStorage.setItem('fitrace_pid', id);
  }

  function clearPlayer() {
    setMyId(null);
    localStorage.removeItem('fitrace_pid');
  }

  return (
    <GameContext.Provider value={{
      state, myId, isAdmin, ready,
      setIsAdmin, selectPlayer, clearPlayer, onOvertake,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
