/** Arc-length integration of a thin sheet, in page widths. The spine is fixed.
 * The free edge leads the turn; the bend travels towards the binding.
 * Coordinates: +x = free edge, +y = top, +z = towards the reader. */
export function paperPoint(u: number, v: number, progress: number, grabY: number) {
  const p = Math.max(0, Math.min(1, progress));
  const lift = Math.sin(Math.PI * p);
  const tilt = (v - grabY) * .19 * lift;
  const base = Math.PI * p;
  const bend = .96 * lift;
  let x = 0, z = 0;
  // Midpoint quadrature keeps the sheet's arc length and both endpoints stable.
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const s = u * (i + .5) / steps;
    const angle = base + bend * (2 * s - .72) + tilt * s;
    x += Math.cos(angle) * u / steps;
    z += Math.sin(angle) * u / steps;
  }
  const ripple = .012 * lift * Math.sin(Math.PI * u) * Math.sin(v * Math.PI * 1.5 + p * 4);
  return { x, y: v - .5, z: Math.max(0, z + ripple) };
}

export const TURN_THRESHOLD = .4;
/** Invert the free edge's arc so the paper follows the hand in page coordinates. */
export function progressForEdge(edgeX: number, grabY: number) {
  const x = Math.max(-1, Math.min(1, edgeX));
  if (x === 1) return 0;
  if (x === -1) return 1;
  let low = 0, high = 1;
  for (let i = 0; i < 14; i++) {
    const middle = (low + high) / 2;
    if (paperPoint(1, grabY, middle, grabY).x > x) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
/** Velocity is progress per millisecond; projected momentum never overrides reversal. */
export function shouldComplete(progress: number, velocity: number) {
  return Math.max(0, Math.min(1, progress + velocity * 150)) >= TURN_THRESHOLD;
}
