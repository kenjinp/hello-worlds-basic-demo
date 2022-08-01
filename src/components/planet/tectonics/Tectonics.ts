import { Color, MathUtils, Vector3 } from "three";
import { Region, VoronoiSphere } from "../voronoi/Voronoi";
import { Plate } from "./Plate";
import { randomFloodFill } from "./randomFloodFill";

function randomUnitVector(random: () => number) {
  var theta = random.real(0, Math.PI * 2);
  var phi = Math.acos(random.realInclusive(-1, 1));
  var sinPhi = Math.sin(phi);
  return new Vector3(
    Math.cos(theta) * sinPhi,
    Math.sin(theta) * sinPhi,
    Math.cos(phi)
  );
}

export function choosePlateStartPoints(
  regions: Region[],
  numberOfPlates: number,
  randomMinMaxInteger: (min: number, max: number) => number
) {
  const chosenRegions = new Set<number>();
  while (chosenRegions.size < numberOfPlates) {
    chosenRegions.add(randomMinMaxInteger(0, regions.length));
  }
  return chosenRegions;
}

const oceanicRate = 0.75;

export class Tectonics {
  plates: Map<number, Plate> = new Map();
  constructor(
    public readonly voronoiSphere: VoronoiSphere,
    public readonly numberOfPlates: number
  ) {
    let i = 0;
    choosePlateStartPoints(
      voronoiSphere.regions,
      numberOfPlates,
      MathUtils.randInt
    ).forEach((val) => {
      const oceanic = MathUtils.randFloat(0, 1) < oceanicRate;
      this.plates.set(
        i,
        new Plate({
          color: new Color(Math.random() * 0xffffff),
          name: `plate-${this.plates.size}`,
          startRegion: voronoiSphere.regions[val],
          driftAxis: new Vector3().randomDirection(),
          driftRate: MathUtils.randFloat(-Math.PI / 30, Math.PI / 30),
          spinRate: MathUtils.randFloat(-Math.PI / 30, Math.PI / 30),
          elevation: oceanic
            ? MathUtils.randFloat(-0.8, -0.3)
            : MathUtils.randFloat(0.1, 0.5),
          oceanic,
        })
      );
      i++;
    });

    // hello lets do a random floodfill aglo
    randomFloodFill(
      voronoiSphere,
      this.plates,
      MathUtils.randInt,
      MathUtils.randFloat
    );
  }
}
