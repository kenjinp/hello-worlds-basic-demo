import { Vector3 } from "three";
import { polarToCartesian } from "../Planet.cartesian";

export function find(neighbors, points, radius: number) {
  return {
    findFromPolar(x: number, y: number, next = 0) {
      let cell,
        dist,
        found = next;
      const xyz = polarToCartesian(y, x, radius);
      do {
        cell = next;
        next = null;
        dist = xyz.distanceToSquared(
          polarToCartesian(points[cell][1], points[cell][0], radius)
        );
        neighbors[cell].forEach((i) => {
          let ndist = xyz.distanceToSquared(
            polarToCartesian(points[i][1], points[i][0], radius)
          );
          if (ndist < dist) {
            dist = ndist;
            next = i;
            found = i;
            return;
          }
        });
      } while (next !== null);

      return found;
    },
    findFromCartesian(xyz: Vector3, next = 0) {
      let cell,
        dist,
        found = next;
      do {
        cell = next;
        next = null;
        dist = xyz.distanceToSquared(
          polarToCartesian(points[cell][1], points[cell][0], radius)
        );
        neighbors[cell].forEach((i) => {
          let ndist = xyz.distanceToSquared(
            polarToCartesian(points[i][1], points[i][0], radius)
          );
          if (ndist < dist) {
            dist = ndist;
            next = i;
            found = i;
            return;
          }
        });
      } while (next !== null);

      return found;
    },
  };
}
