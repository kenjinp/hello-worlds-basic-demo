import {
  ChunkGenerator3,
  createThreadedPlanetWorker,
} from "@hello-worlds/planets";
import { Color, Vector3 } from "three";
import { Plate } from "./tectonics/Plate";
import { Tectonics } from "./tectonics/Tectonics";

// We're not doing anything with this yet
export type ThreadParams = {
  tectonics: Tectonics;
};

const tempVector3 = new Vector3();
const groundColor = new Color(0x55b519);
const oceanColor = new Color(0x09c3db);
const noColor = new Color(0x000000);

let hNext: number | undefined = undefined;

const heightGenerator: ChunkGenerator3<ThreadParams, number> = {
  get({ input, data: { tectonics }, radius }) {
    const finding = Tectonics.findPlateFromCartesian(tectonics, input, hNext);
    if (finding) {
      const { plate, region } = finding;
      const movement = Plate.calculateMovement(
        plate,
        tempVector3.copy(region.properties.siteXYZ),
        tempVector3
      );
      return movement.length();
    }
    return 0;
  },
};

let cNext: number | undefined = undefined;

const colorGenerator: ChunkGenerator3<ThreadParams, Color> = {
  get({ worldPosition, data: { tectonics }, radius }) {
    const finding = Tectonics.findPlateFromCartesian(
      tectonics,
      worldPosition,
      cNext
    );
    if (finding) {
      return finding.plate.oceanic ? oceanColor : groundColor;
    }
    return noColor;
  },
};

createThreadedPlanetWorker<ThreadParams>({
  heightGenerator,
  colorGenerator,
});
