import { LongLat } from "../voronoi/math";

export class PolarSpatialHashGrid<T> {
  readonly cells = new Map<string, T>();
  constructor(resolution: [x: number, y: number]) {}

  addItem(
    longLat: LongLat,
    dimensions: [w: number, h: number] // width/height
  ) {}

  getCellIndex(longLat: LongLat) {}

  #key(longLat: LongLat) {
    return longLat.join("/");
  }

  removeItem() {}

  nearbyItems() {}
}

// const grid = new PolarSpatialHashGrid();

// const client = grid.newClient()
// const nearby = grid.findNearby()
