import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as d3 from "d3-geo-voronoi";
import { useControls } from "leva";
import * as React from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  Sphere,
  Vector3,
} from "three";
import { cartesianToPolar } from "./Planet.cartesian";
// import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry";
import { find } from "./geo/find";
import { polarToCartesian } from "./Planet.cartesian";
import { generateFibonacciSphereAlt } from "./Planet.geometry.js";
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
    numberPoints: 1000,
    pointsColor: "#ff69b4",
    pointsSize: 100,
  });

  const { camera } = useThree();

  const meshRef = React.useRef<Mesh>(null);
  const [sphere, setSphere] = React.useState<Sphere | null>(null);
  const [target, setTarget] = React.useState(new Vector3());
  const geoRef = React.useRef<any>(null);
  const pointsRef = React.useRef<BufferGeometry>(null);
  const [selected, setSelected] = React.useState<number>();
  const sphereRef = React.useRef<Mesh>(null);

  React.useEffect(() => {
    if (meshRef.current && sphereRef.current) {
      setSphere(new Sphere(meshRef.current.position, planet.planetRadius));

      const latlong = generateFibonacciSphereAlt(
        planet.numberPoints,
        planet.jitter,
        Math.random
      );

      const geo = d3.geoVoronoi(latlong);
      const d3Stuff = d3.geoDelaunay(latlong);
      const polygons = geo.polygons(latlong);
      const tmpColor = new Color(0xffffff);

      const getClosest = find(d3Stuff.neighbors, latlong, planet.planetRadius);
      const colorMap: Color[] = [];

      const values = polygons.features.reduce(
        (memo, entry, index) => {
          // console.log({ feature: entry });
          const featureColor = tmpColor.setHex(Math.random() * 0xffffff);
          colorMap[index] = featureColor.clone();
          const [lon, lat] = entry.properties.site;
          const { x, y, z } = polarToCartesian(lat, lon, planet.planetRadius);

          memo.points.push(x, y, z);
          memo.pointsColors.push(
            featureColor.r,
            featureColor.g,
            featureColor.b
          );

          return memo;
        },
        {
          points: [],
          polygonVerts: [],
          pointsColors: [],
          polygonColors: [],
        }
      );

      // meshRef.current.geometry.setAttribute(
      //   "position",
      //   new Float32BufferAttribute(values.polygonVerts, 3)
      // );
      // meshRef.current.geometry.setAttribute(
      //   "color",
      //   new Float32BufferAttribute(values.polygonColors, 3)
      // );

      const positions = sphereRef.current?.geometry.getAttribute("position");
      const colors = [];
      const tempVec = new Vector3();
      const plainColor = new Color();
      let lastNode = 0;
      for (let i = 0; i < positions!.array.length; i += 3) {
        const x = positions.array[i];
        const y = positions.array[i + 1];
        const z = positions.array[i + 2];

        tempVec.set(x, y, z).multiplyScalar(planet.planetRadius);
        const closestFeature = getClosest.findFromCartesian(tempVec, lastNode);
        lastNode = closestFeature;
        // const feat = polygons.features[closestFeature];
        const color = colorMap[closestFeature];
        if (color) {
          colors.push(color.r, color.g, color.b);
        } else {
          colors.push(plainColor.r, plainColor.g, plainColor.b);
        }
      }

      sphereRef.current.geometry.setAttribute(
        "color",
        new Float32BufferAttribute(colors, 3)
      );

      if (pointsRef.current) {
        pointsRef.current.setAttribute(
          "position",
          new Float32BufferAttribute(values.points, 3)
        );
        pointsRef.current.setAttribute(
          "color",
          new Float32BufferAttribute(values.pointsColors, 3)
        );
      }

      geoRef.current = {
        polygons,
        geo: geo()(latlong),
        d3: d3Stuff,
        values,
        latlong,
        colorMap,
      };

      console.log(geoRef.current);
    }
  }, [meshRef, planet, pointsRef, sphereRef]);

  React.useEffect(() => {
    camera.position.copy(
      new Vector3(planet.planetRadius * 1.5, 0, planet.planetRadius * 1.5)
    );
    camera.lookAt(new Vector3(0, 0, 0));
  }, [planet.planetRadius]);

  const handlePointer = (e) => {
    e.ray.intersectSphere(sphere, target);
    const intersection = target.clone();
    console.log("click", intersection, target);
    setTarget(intersection);
    if (geoRef.current) {
      const [long, lat] = cartesianToPolar(intersection);

      const selection = find(
        geoRef.current.d3.neighbors,
        geoRef.current.latlong,
        planet.planetRadius
      ).findFromPolar(long, lat);

      setSelected(selection);
    }
  };

  const selectedPosition = new Vector3();
  if (selected) {
    const [long, lat] =
      geoRef.current.polygons.features[selected].properties.site;
    selectedPosition.copy(polarToCartesian(lat, long, planet.planetRadius));
  }

  return (
    <group>
      <mesh
        frustumCulled={false}
        // scale={
        //   new Vector3(
        //     planet.planetRadius,
        //     planet.planetRadius,
        //     planet.planetRadius
        //   )
        // }
      >
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
          <icosahedronGeometry args={[1, 80]} />
          <meshBasicMaterial vertexColors />
        </mesh>
        <Html>
          <p>target longlat: {cartesianToPolar(target).join(" ,")}</p>
          <p>radius: {sphere?.radius}</p>
          <p>target xyz: {[target.x, target.y, target.z].join(", ")}</p>
        </Html>
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
        <mesh ref={meshRef}>
          <bufferGeometry />
          {/* <sphereGeometry /> */}
          {/* <sphereBufferGeometry  */}
          {/* <sphereGeometry args={[planet.planetRadius, 32, 16]}></sphereGeometry> */}
          <meshBasicMaterial side={DoubleSide} vertexColors />
        </mesh>
      </mesh>
    </group>
  );
};
