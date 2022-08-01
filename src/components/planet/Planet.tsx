import { useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as React from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  Sphere,
  Vector3,
} from "three";
import { PlateLabels } from "./tectonics/PlateLabel";
import { TectonicsComponent } from "./tectonics/TectonicsComponent";
import { VoronoiSphere } from "./voronoi/Voronoi";

export const Planet: React.FC = () => {
  const planet = useControls("planet", {
    planetRadius: {
      min: 100,
      max: 5_000 * 4,
      value: 5_000 * 4,
      step: 10,
    },
    jitter: {
      min: -10.0,
      max: 10.0,
      value: 1.0,
      step: 0.01,
    },
    numberPoints: {
      min: 32,
      max: 50_000,
      value: 10_000,
      step: 10,
    },
    pointsColor: "#000000",
    pointsSize: 100,
  });

  const tectonic = useControls("tectonics", {
    numberOfPlates: {
      min: 2,
      max: 100,
      value: 17,
      step: 1,
    },
    hideLabels: false,
  });

  const { camera } = useThree();

  const meshRef = React.useRef<Mesh>(null);
  const [sphere, setSphere] = React.useState<Sphere | null>(null);
  const [target, setTarget] = React.useState(new Vector3());
  const pointsRef = React.useRef<BufferGeometry>(null);
  const [selected, setSelected] = React.useState<number>();
  const sphereRef = React.useRef<Mesh>(null);

  const [voronoi, setVoronoi] = React.useState(() =>
    VoronoiSphere.createFromFibonacciSphere(
      planet.numberPoints,
      planet.jitter,
      planet.planetRadius,
      Math.random
    )
  );

  React.useEffect(() => {
    setVoronoi(
      VoronoiSphere.createFromFibonacciSphere(
        planet.numberPoints,
        planet.jitter,
        planet.planetRadius,
        Math.random
      )
    );
  }, [planet.planetRadius, planet.jitter, planet.numberPoints]);

  React.useEffect(() => {
    if (meshRef.current && sphereRef.current) {
      setSphere(new Sphere(meshRef.current.position, planet.planetRadius));

      const tmpColor = new Color();
      const pointsColor = new Color().setStyle(planet.pointsColor);
      const regions = voronoi.regions;

      const points = [];
      const pointsColors = [];
      const regionColors = [];
      const regionVerts = [];

      for (let i = 0; i < regions.length; i++) {
        const feature = regions[i];

        const { x, y, z } = feature.properties.siteXYZ;
        const featureColor = tmpColor.setHex(Math.random() * 0xffffff).clone();

        points.push(x, y, z);
        pointsColors.push(pointsColor.r, pointsColor.g, pointsColor.b);

        regionVerts.push(...feature.geometry.vertices);

        for (let c = 0; c < feature.geometry.vertices.length; c += 3) {
          regionColors.push(featureColor.r, featureColor.g, featureColor.b);
        }
      }

      meshRef.current.geometry.setAttribute(
        "position",
        new Float32BufferAttribute(regionVerts, 3)
      );
      meshRef.current.geometry.setAttribute(
        "color",
        new Float32BufferAttribute(regionColors, 3)
      );

      meshRef.current.geometry.computeVertexNormals();

      if (pointsRef.current) {
        pointsRef.current.setAttribute(
          "position",
          new Float32BufferAttribute(points, 3)
        );
        pointsRef.current.setAttribute(
          "color",
          new Float32BufferAttribute(pointsColors, 3)
        );
      }
    }
  }, [meshRef, planet, pointsRef, sphereRef, voronoi]);

  React.useEffect(() => {
    camera.position.copy(
      new Vector3(planet.planetRadius * 1.5, 0, planet.planetRadius * 1.5)
    );
    camera.lookAt(new Vector3(0, 0, 0));
  }, [planet.planetRadius]);

  const handlePointer = (e) => {
    e.ray.intersectSphere(sphere, target);
    const intersection = target.clone();
    setTarget(intersection);
    const selection = voronoi.find.fromCartesian(intersection);
    setSelected(selection);
  };

  const selectedPosition = new Vector3();
  if (selected) {
    selectedPosition.copy(voronoi.regions[selected].properties.siteXYZ);
  }

  return (
    <group>
      <mesh frustumCulled={false}>
        <mesh
          scale={
            new Vector3(
              planet.planetRadius,
              planet.planetRadius,
              planet.planetRadius
            )
          }
          ref={sphereRef}
          onClick={handlePointer}
        >
          <icosahedronGeometry args={[1, 15]} />
          <meshBasicMaterial vertexColors visible={false} />
        </mesh>
        <points>
          <pointsMaterial size={planet.pointsSize} vertexColors />
          <bufferGeometry ref={pointsRef} />
        </points>

        {Number.isFinite(selected) && (
          <mesh scale={new Vector3(500, 500, 500)} position={selectedPosition}>
            <sphereGeometry />
            <meshBasicMaterial color="pink" />
          </mesh>
        )}

        <mesh scale={new Vector3(500, 500, 500)} position={target}>
          <sphereGeometry />
          <meshBasicMaterial color="blue" />
        </mesh>

        <TectonicsComponent
          numberOfPlates={tectonic.numberOfPlates}
          voronoiSphere={voronoi}
        >
          {!tectonic.hideLabels && <PlateLabels occludeRef={[sphereRef]} />}
        </TectonicsComponent>

        <mesh ref={meshRef}>
          <bufferGeometry />
          <meshStandardMaterial vertexColors visible={false} />
        </mesh>
      </mesh>
    </group>
  );
};
