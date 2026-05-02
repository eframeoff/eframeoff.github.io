export default function Avatar({ player, size = 44, style = {}, onClick }) {
  const s = {
    width: size, height: size, borderRadius: '50%',
    flexShrink: 0, overflow: 'hidden',
    border: `2.5px solid ${player.color}`,
    ...style,
  };
  if (player.photo) {
    return <img src={player.photo} style={{ ...s, objectFit: 'cover' }} onClick={onClick} />;
  }
  return (
    <div style={{
      ...s,
      background: player.color + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 900, color: player.color,
      cursor: onClick ? 'pointer' : 'default',
    }} onClick={onClick}>
      {(player.name || '?')[0].toUpperCase()}
    </div>
  );
}
