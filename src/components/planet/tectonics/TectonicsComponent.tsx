import { Html } from "@react-three/drei";
import * as React from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from "three";
import { VoronoiSphere } from "../voronoi/Voronoi";
import { Tectonics as TectonicsImplementation } from "./Tectonics";

export const TectonicsComponent: React.FC<{
  voronoiSphere: VoronoiSphere;
  numberOfPlates: number;
}> = ({ voronoiSphere, numberOfPlates }) => {
  const tectonics = React.useMemo(
    () => new TectonicsImplementation(voronoiSphere, numberOfPlates),
    [voronoiSphere, numberOfPlates]
  );

  const [mat] = React.useState(new MeshBasicMaterial({ vertexColors: true }));

  const meshRef = React.useRef<Mesh>(null);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) {
      tectonics.plates.forEach((plate) => {
        const geo = new BufferGeometry();
        const mesh = new Mesh(geo, mat);
        const regionColors: number[] = [];
        const regionVerts: number[] = [];

        plate.regions.forEach((region) => {
          const featureColor = plate.color;
          regionVerts.push(...region.geometry.vertices);

          for (let c = 0; c < region.geometry.vertices.length; c += 3) {
            regionColors.push(featureColor.r, featureColor.g, featureColor.b);
          }
        });

        geo.setAttribute(
          "position",
          new Float32BufferAttribute(regionVerts, 3)
        );
        geo.setAttribute("color", new Float32BufferAttribute(regionColors, 3));

        geo.computeVertexNormals();

        meshRef.current?.add(mesh);
      });
    }
    return () => {
      mesh?.children.forEach((child) => {
        child.removeFromParent();
        (child as Mesh).geometry.deleteAttribute("color");
        (child as Mesh).geometry.deleteAttribute("position");
        (child as Mesh).geometry.dispose();
      });
    };
  }, [tectonics, meshRef]);

  const labels = React.useMemo(() => {
    return Array.from(tectonics.plates.values()).map((plate) => {
      return (
        <Html
          position={plate.startRegion.properties.siteXYZ}
          occlude={[meshRef]}
        >
          <div
            style={{
              padding: "0.5em",
              borderRadius: "4px",
              background: "black",
              minWidth: "60px",
              color: `#${plate.color.getHexString()}`,
              boxShadow: `1px 0px 7px black`,
            }}
          >
            <span>{plate.name}</span>
          </div>
        </Html>
      );
    });
  }, [tectonics]);

  return (
    <>
      <group>{labels}</group>
      <mesh ref={meshRef}></mesh>
    </>
  );
};
