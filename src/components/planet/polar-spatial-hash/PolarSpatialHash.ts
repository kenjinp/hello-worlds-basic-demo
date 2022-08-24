import { LongLat } from "../voronoi/math";

export class PolarSpatialHashGrid<T> {
  readonly cells = new Map<string, Set<T>>();
  constructor(
    radius: number, // maybe this isn't needed?
    resolution: [divisionsLong: number, divisionsLat: number]
  ) {
    const [divisionsLong, divisionsLat] = resolution;
    const minLong = -180;
    const dLong = 180 * 2;
    const sizeLong = dLong / divisionsLong;
    const minLat = -90;
    const dLat = 90 * 2;
    const sizeLat = dLat / divisionsLat;

    if (divisionsLong < 1) {
      throw new Error("must provide a divisionsLong value <= 1");
    }
    if (divisionsLat < 1) {
      throw new Error("must provide a divisionsLat value <= 1");
    }

    for (let indexLong = 1; indexLong <= divisionsLong; indexLong++) {
      for (let indexLat = 1; indexLat <= divisionsLat; indexLat++) {
        const long0 = indexLong - 1;
        const lat0 = indexLat - 1;
        const mnLong = minLong + sizeLong * long0;
        const mxLong = mnLong + sizeLong;
        const mnLat = minLat + sizeLat * lat0;
        const mxLat = mnLat + sizeLat;
        this.cells.set(
          this.#key([mnLong, mnLat], [mxLong, mxLat]),
          new Set<T>()
        );
      }
    }

    console.log(this.cells);
    // LAT = 90 - 90
    // LONG = 180 - -180
  }

  addItem(longLat: LongLat, radius: number) {
    //
    // get the BB of the point and radius
    // add to each key where he fits
  }

  getCellIndex(longLat: LongLat) {
    //
  }

  #key(minLongLat: LongLat, maxLongLat: LongLat) {
    return [minLongLat.join(","), maxLongLat.join(",")].join("/");
  }

  removeItem() {
    //
  }

  nearbyItems(longLat: LongLat) {
    //
  }
}

// const grid = new PolarSpatialHashGrid();

// const client = grid.newClient()
// const nearby = grid.findNearby()
