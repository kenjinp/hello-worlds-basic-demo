import { Html } from "@react-three/drei";
import * as React from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from "three";
import { VoronoiSphere } from "../voronoi/Voronoi";
import { PlateLabel } from "./PlateLabel";
import { Tectonics as TectonicsImplementation } from "./Tectonics";

const TectonicsContext = React.createContext<TectonicsImplementation>(
  null as unknown as TectonicsImplementation
);

export const useTectonics = () => {
  return React.useContext(TectonicsContext);
};

export const TectonicsComponent: React.FC<
  React.PropsWithChildren<{
    voronoiSphere: VoronoiSphere;
    numberOfPlates: number;
  }>
> = ({ voronoiSphere, numberOfPlates, children }) => {
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
      mesh?.traverse((child) => {
        (child as Mesh).geometry.deleteAttribute("color");
        (child as Mesh).geometry.deleteAttribute("position");
        (child as Mesh).geometry.dispose();
      });
      mesh?.children.forEach((child) => child.removeFromParent());
    };
  }, [tectonics, meshRef]);

  return (
    <TectonicsContext.Provider value={tectonics}>
      {children}
      <mesh ref={meshRef}></mesh>
    </TectonicsContext.Provider>
  );
};
