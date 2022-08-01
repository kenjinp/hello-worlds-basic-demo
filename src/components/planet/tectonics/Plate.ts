import { Color, Vector3 } from "three";
import { Region } from "../voronoi/Voronoi";

export interface PlateProps {
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
  name: string;
  color: Color;
  driftAxis: Vector3;
  driftRate: number;
  spinRate: number;
  elevation: number;
  oceanic: boolean;
  startRegion: Region;
  regions: Map<number, Region> = new Map<number, Region>();
  constructor({
    name,
    color,
    driftAxis,
    driftRate,
    spinRate,
    elevation,
    oceanic,
    startRegion,
  }: PlateProps) {
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
}
