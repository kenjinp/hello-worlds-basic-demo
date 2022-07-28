import earcut from "earcut";
import { polarToCartesian } from "../Planet.cartesian";

import interpolateLine from "./interpolate";

export function genPolygon(coords, radius: number) {
  const coords3d = coords.map((coordsSegment) =>
    interpolateLine(coordsSegment).map(([lng, lat]) =>
      polarToCartesian(lat, lng, radius)
    )
  );

  // Each point generates 3 vertice items (x,y,z).
  const { vertices, holes } = earcut.flatten(coords3d);

  const firstHoleIdx = holes[0] || Infinity;
  const outerVertices = vertices.slice(0, firstHoleIdx * 3);
  const holeVertices = vertices.slice(firstHoleIdx * 3);

  const holesIdx = new Set(holes);

  const numPoints = Math.round(vertices.length / 3);

  const outerIndices = [],
    holeIndices = [];
  for (let vIdx = 1; vIdx < numPoints; vIdx++) {
    if (!holesIdx.has(vIdx)) {
      if (vIdx < firstHoleIdx) {
        outerIndices.push(vIdx - 1, vIdx);
      } else {
        holeIndices.push(vIdx - 1 - firstHoleIdx, vIdx - firstHoleIdx);
      }
    }
  }

  const groups = [{ indices: outerIndices, vertices: outerVertices }];

  if (holes.length) {
    groups.push({ indices: holeIndices, vertices: holeVertices });
  }

  return groups;
}
