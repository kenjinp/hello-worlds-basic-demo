import * as d3 from "d3-geo-voronoi";
import { find } from "./find";
import { fibonacciSphere, LongLat } from "./math";
import { convertFeaturesToRegions } from "./regions";

export interface GeoFeature {
  type: "Feature";
  geometry: {
    coordinates: [LongLat[]];
    type: "Polygon";
  };
  properties: {
    neighbors: number[];
    site: LongLat;
    sitecoodinates: LongLat;
  };
}

export interface Region {
  type: "Feature";
  geometry: {
    coordinates: [LongLat[]];
    vertices: number[];
    type: "Polygon";
  };
  properties: {
    neighbors: number[];
    site: LongLat;
    sitecoodinates: LongLat;
  };
}

export type neighbors = number[][];

// Chop up a sphere into Voronoi Regions
// Offers a couple of helpful query methods
export default class VoronoiSphere {
  regions: Region[];
  neighbors: neighbors;
  constructor(
    public readonly points: LongLat[],
    public readonly radius: number
  ) {
    this.regions = convertFeaturesToRegions(
      d3.geoVoronoi(this.points).polygons(this.points) as GeoFeature[],
      radius
    );
    this.neighbors = d3.geoDelaunay(this.points);
  }

  get find() {
    const findIndex = find(this.neighbors, this.points, this.radius);
    return {
      fromPolar: findIndex.findFromPolar,
      fromCartesian: findIndex.findFromCartesian,
    };
  }

  static createFromFibbonacciSphere(
    numberOfPoints: number,
    jitter: number,
    radius: number,
    random: () => number
  ) {
    return new VoronoiSphere(
      fibonacciSphere(numberOfPoints, jitter, random),
      radius
    );
  }
}
