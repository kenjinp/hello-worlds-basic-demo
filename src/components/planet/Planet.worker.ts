import {
  ChunkGenerator3,
  createThreadedPlanetWorker,
  DEFAULT_NOISE_PARAMS,
  Lerp,
  Noise,
} from "@hello-worlds/planets";
import { Color, Vector3 } from "three";
import { LinearSpline } from "./Spline";
import { BoundaryTypes } from "./tectonics/Edge";
import { Plate } from "./tectonics/Plate";
import { Tectonics } from "./tectonics/Tectonics";

// We're not doing anything with this yet
export type ThreadParams = {
  tectonics: Tectonics;
  seaLevel: number;
};

const tempVector3 = new Vector3();
const tempColor = new Color();
const groundColor = new Color(0x55b519);
const oceanColor = new Color(0x09c3db);
const noColor = new Color(0x000000);

let hNext: number | undefined = undefined;

const calculateSubductionElevation = (distance: number, magnitude: number) => {
  return Math.max(-Math.abs(distance) + magnitude * 40, 0);
};

const greatCircleDistance = (a: Vector3, b: Vector3, radius: number) => {
  const distance = Math.sqrt(
    (b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2
  );
  const phi = Math.asin(distance / 2 / radius);
  return 2 * phi * radius;
};

const noise = new Noise({
  ...DEFAULT_NOISE_PARAMS,
  seed: "banana", // <-important
  height: 50.0,
  scale: 5000.0,
});
const simpleHeight: ChunkGenerator3<ThreadParams, number> = {
  // maybe we can use this as a base for an ocean
  get({ input, data: { tectonics }, radius }) {
    let elevation =
      Tectonics.findPlateFromCartesian(tectonics, input, hNext)?.plate
        .elevation || 0;
    // let elevation = 0;
    // let's find subduction points
    const edgeArray = Array.from(tectonics.edges.values());
    for (let e = 0; e < edgeArray.length; e++) {
      const edge = edgeArray[e];
      for (let c = 0; c < edge.coordinates.length; c++) {
        const coord = edge.coordinates[c];
        if (
          coord.boundaryType === BoundaryTypes.SUBDUCTION ||
          coord.boundaryType === BoundaryTypes.SUPERDUCTION ||
          coord.boundaryType === BoundaryTypes.OCEAN_COLLISION
        ) {
          const distance = input.distanceTo(coord.coordinate);
          const magnitude = coord.elevation;
          const modifier = calculateSubductionElevation(distance, magnitude);
          elevation += modifier;
        }
      }
    }
    // tectonics.edges.forEach((edge) => {
    //   edge.coordinates.forEach((coord) => {
    //     coord.boundaryType === BoundaryTypes.SUBDUCTION ||
    //       coord.boundaryType === BoundaryTypes.SUPERDUCTION;
    //     const distance = input.distanceTo(coord.coordinate);
    //     elevation += subductionFn(distance);
    //   });
    // });
    return noise.get(input.x, input.y, input.z) * elevation;
    // return elevation;
  },
};

const PlateMovementHeightGenerator: ChunkGenerator3<ThreadParams, number> = {
  get({ input, data: { tectonics }, radius }) {
    const finding = Tectonics.findPlateFromCartesian(tectonics, input, hNext);
    if (finding) {
      const { plate, region } = finding;
      const movement = Plate.calculateMovement(
        plate,
        tempVector3.copy(region.properties.siteXYZ).clone(),
        tempVector3.clone()
      );
      return movement.length();
    }
    return 0;
  },
};

const PlateElevationHeightGenerator: ChunkGenerator3<ThreadParams, number> = {
  get({ input, data: { tectonics }, radius }) {
    const finding = Tectonics.findPlateFromCartesian(tectonics, input, hNext);
    if (finding) {
      const { plate, region } = finding;
      return plate.elevation;
    }
    return 0;
  },
};

let cNext: number | undefined = undefined;

const colorLerp: Lerp<THREE.Color> = (
  t: number,
  p0: THREE.Color,
  p1: THREE.Color
) => {
  const c = p0.clone();
  return c.lerp(p1, t);
};

const colorSplines = [
  new LinearSpline<THREE.Color>(colorLerp),
  new LinearSpline<THREE.Color>(colorLerp),
  new LinearSpline<THREE.Color>(colorLerp),
];

// Temp / Aridity
colorSplines[0].addPoint(0.0, new Color(0x37a726));
colorSplines[0].addPoint(0.5, new Color(0x526b48));
colorSplines[0].addPoint(1.0, new Color(0xbab3a2));

// Humid
// colorSplines[1].addPoint(0.0, new THREE.Color(this.params.humidLow));
// colorSplines[1].addPoint(0.5, new THREE.Color(this.params.humidMid));
// colorSplines[1].addPoint(1.0, new THREE.Color(this.params.humidHigh));

// sea
colorSplines[2].addPoint(0, new Color(0x10313e));
colorSplines[2].addPoint(0.03, new Color(0x1d5a67));
colorSplines[2].addPoint(0.05, new Color(0x469280));

const colorGenerator: ChunkGenerator3<ThreadParams, Color> = {
  get({ input, worldPosition, data: { tectonics, seaLevel }, radius }) {
    const height = input.z;
    // const finding = Tectonics.findPlateFromCartesian(
    //   tectonics,
    //   worldPosition,
    //   cNext
    // );
    // if (finding) {
    //   return finding.plate.oceanic ? oceanColor : groundColor;
    // }
    // return noColor;
    if (height < seaLevel) {
      return tempColor.clone().setRGB(0, 0, -height);
      // return colorSplines[2].get(remap(height, -5, 0, 0, 1));
    }

    return tempColor.clone().setRGB(height, height, height);

    // const c1 = colorSplines[0].get(remap(seaLevel + height, 0, 20, 0, 1));
    // return c1;
    // const c2 = colorSplines[1].get(h);

    // return c1.lerp(c2, 1);
  },
};

createThreadedPlanetWorker<ThreadParams>({
  heightGenerator: simpleHeight,
  colorGenerator,
});
