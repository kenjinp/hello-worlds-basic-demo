import { Color, Vector3 } from "three";
import { Region } from "../voronoi/Voronoi";

export interface PlateProps {
  index: number;
  name: string;
  color: Color;
  driftAxis: Vector3;
  driftRate: number;
  spinRate: number;
  elevation: number;
  oceanic: boolean;
  startRegion: Region;
}

export class Plate {
  index: number;
  name: string;
  color: Color;
  driftAxis: Vector3;
  driftRate: number;
  spinRate: number;
  elevation: number;
  oceanic: boolean;
  startRegion: Region;
  regions: Map<number, Region> = new Map<number, Region>();
  externalBorderRegions: Map<number, Region> = new Map<number, Region>();
  internalBorderRegions: Map<number, Region> = new Map<number, Region>();
  sides: Set<Vector3> = new Set();
  constructor({
    index,
    name,
    color,
    driftAxis,
    driftRate,
    spinRate,
    elevation,
    oceanic,
    startRegion,
  }: PlateProps) {
    this.index = index;
    this.color = color;
    this.driftAxis = driftAxis;
    this.driftRate = driftRate;
    this.spinRate = spinRate;
    this.elevation = elevation;
    this.oceanic = oceanic;
    this.startRegion = startRegion;
    this.name = name;
    this.regions.set(startRegion.properties.index, startRegion);
  }

  calculateMovement(position: Vector3) {
    const movement = this.driftAxis
      .clone()
      .cross(position)
      .setLength(
        this.driftRate *
          position.clone().projectOnVector(this.driftAxis).distanceTo(position)
      );
    movement.add(
      this.startRegion.properties.siteXYZ
        .clone()
        .cross(position)
        .setLength(
          this.spinRate *
            position
              .clone()
              .projectOnVector(this.startRegion.properties.siteXYZ)
              .distanceTo(position)
        )
    );
    return movement;
  }

  static calculateMovement(
    plate: Plate,
    position: Vector3,
    tempVector3: Vector3
  ) {
    const driftAxis = tempVector3.copy(plate.driftAxis);
    const startRegionPosition = tempVector3
      .clone()
      .copy(plate.startRegion.properties.siteXYZ);
    const movement = tempVector3
      .copy(driftAxis)
      .cross(position)
      .setLength(
        plate.driftRate *
          position.clone().projectOnVector(driftAxis).distanceTo(position)
      );
    movement.add(
      startRegionPosition
        .cross(position)
        .setLength(
          plate.spinRate *
            position
              .clone()
              .projectOnVector(startRegionPosition)
              .distanceTo(position)
        )
    );
    return movement;
  }
}
