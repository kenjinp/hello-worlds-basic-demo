import {
  ChunkGenerator3,
  createThreadedPlanetWorker,
} from "@hello-worlds/planets";
import { Color } from "three";

export type ThreadParams = {
  seaLevel: number;
};

const oceanColor = new Color(0x09c3db);

const heightGenerator: ChunkGenerator3<ThreadParams, number> = {
  // maybe we can use this as a base for an ocean
  get({ data: { seaLevel } }) {
    return seaLevel;
  },
};

const colorGenerator: ChunkGenerator3<ThreadParams, Color> = {
  get({ worldPosition }) {
    return oceanColor;
  },
};

createThreadedPlanetWorker<ThreadParams>({
  heightGenerator,
  colorGenerator,
});
