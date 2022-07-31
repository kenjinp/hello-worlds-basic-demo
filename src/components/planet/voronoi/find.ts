import { Vector3 } from "three";
import { polarToCartesian } from "../Planet.cartesian";
import { LongLat } from "./math";
import { neighbors } from "./Voronoi";

export function find(neighbors: neighbors, points: LongLat[], radius: number) {
  return {
    findFromPolar(x: number, y: number, next = 0) {
      let _next: number | null = next;
      let cell: number,
        dist: number,
        found = _next;
      const xyz = polarToCartesian(y, x, radius);
      do {
        cell = _next;
        _next = null;
        dist = xyz.distanceToSquared(
          polarToCartesian(points[cell][1], points[cell][0], radius)
        );
        neighbors[cell].forEach((i) => {
          let ndist = xyz.distanceToSquared(
            polarToCartesian(points[i][1], points[i][0], radius)
          );
          if (ndist < dist) {
            dist = ndist;
            _next = i;
            found = i;
            return;
          }
        });
      } while (_next !== null);

      return found;
    },
    findFromCartesian(xyz: Vector3, next = 0) {
      let _next: number | null = next;
      let cell: number,
        dist: number,
        found = _next;
      do {
        cell = _next;
        _next = null;
        dist = xyz.distanceToSquared(
          polarToCartesian(points[cell][1], points[cell][0], radius)
        );
        neighbors[cell].forEach((i) => {
          let ndist = xyz.distanceToSquared(
            polarToCartesian(points[i][1], points[i][0], radius)
          );
          if (ndist < dist) {
            dist = ndist;
            _next = i;
            found = i;
            return;
          }
        });
      } while (_next !== null);

      return found;
    },
  };
}
