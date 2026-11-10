export const PALETTES = Object.freeze([
  { name: 'Ao infinito', background: '#183b65', accent: '#f9ce59' },
  { name: 'Ohana', background: '#154b50', accent: '#ffb8ab' },
  { name: 'Gibi', background: '#fff3d6', accent: '#db473a' },
  { name: 'Galáxia', background: '#442b69', accent: '#bdebd7' },
  { name: 'Papel', background: '#f8e9d9', accent: '#583624' },
]);

function luminance(hex) {
  if (typeof hex !== 'string' || !/^#[\da-f]{6}$/i.test(hex)) return null;
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}

export function contrastRatio(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  if (a === null || b === null) return 0;
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

export function readableColor(background) {
  if (contrastRatio('#201c30', background) >= 4.5) return '#201c30';
  if (contrastRatio('#ffffff', background) >= 4.5) return '#ffffff';
  return '#000000';
}
