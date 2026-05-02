import { chadLevel } from '../utils.js';

const styles = {
  'cr-gigachad':  { background: 'linear-gradient(135deg,#FFB800,#FF6B00)', color: '#09070B', boxShadow: '0 0 12px rgba(255,184,0,.35)' },
  'cr-quality':   { background: 'rgba(255,184,0,.12)', border: '1px solid rgba(255,184,0,.3)', color: '#FFB800' },
  'cr-pretender': { background: 'rgba(255,107,0,.12)', border: '1px solid rgba(255,107,0,.3)', color: '#FF6B00' },
  'cr-skuf':      { background: 'rgba(120,100,80,.2)',  border: '1px solid rgba(120,100,80,.3)', color: '#B0976A' },
  'cr-divan':     { background: 'rgba(80,60,40,.2)',    border: '1px solid rgba(80,60,40,.3)',   color: '#806050' },
  'cr-kartoshka': { background: 'rgba(60,40,20,.2)',    border: '1px solid rgba(60,40,20,.3)',   color: '#604030' },
};

export default function ChadRank({ steps = 0, small = false }) {
  const lv = chadLevel(steps);
  return (
    <span style={{
      fontFamily: "'Oswald', sans-serif",
      fontSize: small ? '.6rem' : '.72rem',
      fontWeight: 700,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 20,
      letterSpacing: '.5px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...styles[lv.cls],
    }}>
      {lv.emoji} {lv.name}
    </span>
  );
}
