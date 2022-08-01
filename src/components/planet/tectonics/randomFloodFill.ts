import { Region, VoronoiSphere } from "../voronoi/Voronoi";
import { Plate } from "./Plate";
import { Queue } from "./Queue";

function shuffle<T>(array: T[], randomFloat: () => number) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(randomFloat() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function randomFloodFill(
  voronoiSphere: VoronoiSphere,
  plates: Map<number, Plate>,
  randomInteger: (min: number, max: number) => number,
  randomFloat: (min: number, max: number) => number
) {
  // We have already established our plate starting regions
  // We will treat these as "fronts" each of which will be a queue
  // that can gobble up it's neighboring regions

  const assignedRegions = new Array(voronoiSphere.regions.length).fill(-1);

  const regionIsAlreadyAssigned = (region: Region) => {
    return assignedRegions[region.properties.index] > -1;
  };

  const assignRegionToPlate = (region: Region, plate: Plate) => {
    assignedRegions[region.properties.index] = region.properties.index;
    plate.regions.set(region.properties.index, region);
  };

  const fronts: Queue<{ region: Region; plate: Plate }>[] = new Array(
    plates.size
  )
    .fill(0)
    .map((_) => new Queue<{ region: Region; plate: Plate }>());

  plates.forEach((plate, index) => {
    assignedRegions[plate.startRegion.properties.index] =
      plate.startRegion.properties.index;
    // we will prime the fronts with a random neighbor of the plates starting region
    fronts[index].enqueue({
      plate,
      region:
        voronoiSphere.regions[
          plate.startRegion.properties.neighbors[
            randomInteger(0, plate.startRegion.properties.neighbors.length - 1)
          ]
        ],
    });
  });

  // while the fronts still have enqueued Regions to process, we will continue
  while (fronts.reduce((memo, q) => memo || !q.isEmpty, false)) {
    // iterate through all the fronts randomly

    // shuffle our fronts
    shuffle<Queue<{ region: Region; plate: Plate }>>(fronts, () =>
      randomFloat(0, 1)
    );

    // deal our fronts
    for (let i = 0; i < fronts.length; i++) {
      const queue = fronts[i];

      const item = queue.dequeue();

      if (!item) {
        continue;
      }
      const { region, plate } = item;

      if (!regionIsAlreadyAssigned(region)) {
        assignRegionToPlate(region, plate);

        region.properties.neighbors.forEach((regionIndex) => {
          const region = voronoiSphere.regions[regionIndex];
          queue.enqueue({ region, plate });
        });
      }
    }
  }
}