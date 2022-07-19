
export function randomSpherePoint(x0: number, y0: number, z0: number, radius: number) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = x0 + radius * Math.sin(phi) * Math.cos(theta);
  const y = y0 + radius * Math.sin(phi) * Math.sin(theta);
  const z = z0 + radius * Math.cos(phi);
  return [x, y, z];
}

export function randomBias(min: number, max: number, bias: number, influence: number) {
  const rnd = Math.random() * (max - min) + min, // random in range
    mix = Math.random() * influence; // random mixer
  return rnd * (1 - mix) + bias * mix; // mix full range and bias
}
