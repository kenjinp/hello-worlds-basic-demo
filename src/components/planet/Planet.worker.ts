import {
  ChunkGenerator3,
  createThreadedPlanetWorker,
} from "@hello-worlds/planets";
import { Color } from "three";
import { Tectonics } from "./tectonics/Tectonics";

// We're not doing anything with this yet
export type ThreadParams = {
  tectonics: Tectonics;
};

const groundColor = new Color(0xffffff);

const heightGenerator: ChunkGenerator3<ThreadParams, number> = {
  get({ input, data: { tectonics } }) {
    return 1;
  },
};

const colorGenerator: ChunkGenerator3<ThreadParams, Color> = {
  get({ worldPosition }) {
    return groundColor;
  },
};

createThreadedPlanetWorker<ThreadParams>({
  heightGenerator,
  colorGenerator,
});
