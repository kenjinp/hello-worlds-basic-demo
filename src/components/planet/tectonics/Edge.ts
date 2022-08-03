import { Region } from "../voronoi/Voronoi";
import { Plate } from "./Plate";
import { Tectonics } from "./Tectonics";

export class Edge {
  plates: Map<number, Plate> = new Map();
  coordinates: number[] = [];
  constructor() {}
}

const findPlateWithMatchingExternalRegion = (
  plates: Tectonics["plates"],
  currentPlate: Plate,
  region: Region
) => {
  let matchingPlate = null;
  for (let i = 0; i < plates.size; i++) {
    const plate = plates.get(i);
    if (!plate) {
      continue;
    }
    if (currentPlate.index === plate.index) {
      continue;
    }
    if (plate.externalBorderRegions.has(region.properties.index)) {
      matchingPlate = plate;
      break;
    }
  }
  return matchingPlate;
};

function intersect(a: any[], b: any[]) {
  var setB = new Set(b);
  return [...new Set(a)].filter((x) => setB.has(x));
}

export function findEdges(tectonics: Tectonics) {
  // lets go through all the plates internalBorders
  tectonics.plates.forEach((plate) => {
    plate.internalBorderRegions.forEach((region) => {
      // find the plate who has this region marked externalRegion
      const matchingPlate = findPlateWithMatchingExternalRegion(
        tectonics.plates,
        plate,
        region
      );

      if (!matchingPlate) {
        console.warn("No matching plate");
        return;
      }

      const edges: number[] = [];

      // find a neighbor to this region that also exists inside the externalRegion plate
      region.properties.neighbors.forEach((neighbor) => {
        // for each neighbor, check to see if it's part of externalRegion plate
        const matchingRegion = matchingPlate.regions.get(neighbor);
        if (matchingRegion) {
          // get intersection of coordinates
          region.geometry.vertices;
          edges.push(
            ...intersect(
              region.geometry.vertices,
              matchingRegion.geometry.vertices
            )
          );
        }
      });

      const edge = new Edge();
      edge.coordinates = edges;
      edge.plates.set(plate.index, plate);
      edge.plates.set(matchingPlate.index, matchingPlate);
      tectonics.edges.push(edge);
    });
  });
}
