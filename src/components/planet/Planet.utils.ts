import { Color } from "three";

/* Pick some pastel colors per index and cache them.
 * Not all operations will benefit from this, but some
 * (like rotation) do, so might as well cache. */
// let _randomColor: Color[] = [];
const colorMap = new Map<number, Color>();
const tmpColor = new Color(0xffffff);
export function randomColor(regionIndex: number) {
  if (!colorMap.has(regionIndex)) {
    tmpColor.setHex(Math.random() * 0xffffff);
    colorMap.set(regionIndex, tmpColor.clone());
  }
  return colorMap.get(regionIndex);
}

export function calcPosFromLatLonRad(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}
