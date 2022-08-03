import * as React from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
} from "three";
import { useTectonics } from "./TectonicsComponent";

const material = new LineBasicMaterial({ color: 0x0000ff });

export const Edges: React.FC = () => {
  const tectonics = useTectonics();
  const groupRef = React.useRef<Group>(null);

  React.useEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    for (let e = 0; e < tectonics.edges.length; e++) {
      const verts: number[] = [];
      const colors: number[] = [];

      const edge = tectonics.edges[e];
      if (!edge) {
        console.warn("plate not found", e);
        continue;
      }
      for (let c = 0; c < edge.coordinates.length; c += 3) {
        const x = edge.coordinates[c];
        const y = edge.coordinates[c + 1];
        const z = edge.coordinates[c + 2];
        verts.push(x, y, z);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(verts, 3));
      const line = new Line(geometry, material);
      group.add(line);
    }

    return () => {
      group?.children.forEach((child) => child.removeFromParent());
    };
  }, [tectonics.edges, groupRef]);

  return <group ref={groupRef}></group>;
};
