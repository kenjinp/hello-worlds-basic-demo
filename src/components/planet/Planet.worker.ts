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
import { remap } from "./tectonics/utils";

// We're not doing anything with this yet
export type ThreadParams = {
  tectonics: Tectonics;
  seaLevel: number;
  subductionConstants: {
    exponential: number;
    modifier: number;
  };
  randomTestPoint: Vector3;
};

const tempVector3 = new Vector3();
const tempColor = new Color();
const groundColor = new Color(0x55b519);
const oceanColor = new Color(0x09c3db);
const noColor = new Color(0x000000);

let hNext: number | undefined = undefined;

const calculateSubductionElevation = (
  distance: number,
  magnitude: number,
  exponential: number = 0.8,
  modifier: number = 100
) => {
  return Math.max(
    1.0 - Math.pow(Math.abs(distance), exponential) + magnitude * modifier,
    0
  );
};

let noise: Noise;
let mountainNoise: Noise;

const tectonicHeightGenerator: ChunkGenerator3<ThreadParams, number> = {
  // maybe we can use this as a base for an ocean
  get({ input, data: { tectonics, subductionConstants }, radius }) {
    if (!noise) {
      noise = new Noise({
        ...DEFAULT_NOISE_PARAMS,
        seed: "banana", // <-important
        height: 50.0,
        scale: radius / 5,
      });
    }
    if (!mountainNoise) {
      mountainNoise = new Noise({
        ...DEFAULT_NOISE_PARAMS,
        seed: "apple", // <-important
        height: 2,
        scale: radius / 10,
      });
    }
    const n = noise.get(input.x, input.y, input.z);
    const m = mountainNoise.get(input.x, input.y, input.z);

    let elevation =
      Tectonics.findPlateFromCartesian(tectonics, input, hNext)?.plate
        .elevation || 0;
    elevation *= n;
    let subductionElevation = elevation;
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
          const modifier = calculateSubductionElevation(
            distance,
            magnitude,
            subductionConstants.exponential,
            // Math.max(-coord.pressure + 1, 0.78),
            subductionConstants.modifier
          );
          const val = modifier + 1 * n;
          if (val) {
            subductionElevation += modifier + 1 * m * modifier;
            // subductionElevation += Math.max(
            //   modifier + 1 * n,
            // );
          }
          // elevation = modifier + 1 * n;
        }
        if (coord.boundaryType === BoundaryTypes.DIVERGING) {
          const distance = input.distanceTo(coord.coordinate);
          const magnitude = coord.elevation;
          const modifier = calculateSubductionElevation(
            distance,
            magnitude,

            subductionConstants.exponential * 1.1,
            subductionConstants.modifier
          );
          elevation -= modifier + 1 * m * modifier;
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
    // return MathUtils.lerp(noise.get(input.x, input.y, input.z) elevation
    return subductionElevation ? subductionElevation + elevation : elevation;
  },
};

const testMountainHeight: ChunkGenerator3<ThreadParams, number> = {
  // maybe we can use this as a base for an ocean
  get({
    input,
    data: { tectonics, subductionConstants, randomTestPoint },
    radius,
  }) {
    let elevation = 0;
    const distance = input.distanceTo(randomTestPoint);
    const magnitude = 1;
    const modifier = calculateSubductionElevation(
      distance,
      magnitude,
      subductionConstants.exponential,
      subductionConstants.modifier
    );
    elevation += modifier + noise.get(input.x, input.y, input.z) * 0.5;
    return elevation;
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
colorSplines[0].addPoint(0.05, new Color(0x214711));
colorSplines[0].addPoint(0.4, new Color(0x526b48));
colorSplines[0].addPoint(0.9, new Color(0xab7916));
colorSplines[0].addPoint(1.0, new Color(0xbab3a2));

// Humid
// colorSplines[1].addPoint(0.0, new THREE.Color(this.params.humidLow));
// colorSplines[1].addPoint(0.5, new THREE.Color(this.params.humidMid));
// colorSplines[1].addPoint(1.0, new THREE.Color(this.params.humidHigh));

// sea
colorSplines[2].addPoint(0, new Color(0x10313e));
colorSplines[2].addPoint(0.98, new Color(0x1d5a67));
colorSplines[2].addPoint(0.995, new Color(0x469280));

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
      // return tempColor.clone().setRGB(0, 0, -height);
      return colorSplines[2].get(remap(height, -20, 0, 0, 1));
    }

    // return tempColor.clone().setRGB(height, height, height);

    const c1 = colorSplines[0].get(remap(seaLevel + height, 0, 100, 0, 1));
    return c1;
    // const c2 = colorSplines[1].get(h);

    // return c1.lerp(c2, 1);
  },
};

createThreadedPlanetWorker<ThreadParams>({
  heightGenerator: tectonicHeightGenerator,
  colorGenerator,
});
