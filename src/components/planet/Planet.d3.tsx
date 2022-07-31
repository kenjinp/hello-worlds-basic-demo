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
  MeshBasicMaterial,
  Sphere,
  SphereGeometry,
  Vector3,
} from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry";
import { find } from "./geo/find";
import { cartesianToPolar, polarToCartesian } from "./Planet.cartesian";
import { generateFibonacciSphereAlt } from "./Planet.geometry.js";

const neighborMaterial = new MeshBasicMaterial({ color: "green" });
const neighborGeo = new SphereGeometry(500, 16, 16);

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

      const longlat = generateFibonacciSphereAlt(
        planet.numberPoints,
        planet.jitter,
        Math.random
      );

      const geo = d3.geoVoronoi(longlat);
      const d3Stuff = d3.geoDelaunay(longlat);
      const polygons = geo.polygons(longlat);
      const tmpColor = new Color(0xffffff);
      const tempVector3 = new Vector3();

      const getClosest = find(d3Stuff.neighbors, longlat, planet.planetRadius);
      const colorMap: Color[] = [];

      const points = [];
      const polygonVerts = [];
      const pointsColors = [];
      const polygonColors = [];

      for (let i = 0; i < polygons.features.length; i++) {
        const feature = polygons.features[i];

        const [lon, lat] = feature.properties.site;
        const vec3 = polarToCartesian(lat, lon, planet.planetRadius);
        const { x, y, z } = vec3;
        const featureColor = tmpColor.setHex(Math.random() * 0xffffff).clone();
        const { x: r, y: g, z: b } = vec3.clone().normalize().addScalar(0.5);
        const xyzColor = tmpColor.setRGB(r, g, b);
        colorMap[i] = xyzColor.clone().lerp(featureColor, 0.25);

        points.push(x, y, z);
        pointsColors.push(featureColor.r, featureColor.g, featureColor.b);

        const coords3d = feature.geometry.coordinates
          .map((coordsSegment) =>
            coordsSegment.map(([lng, lat]) =>
              polarToCartesian(lat, lng, planet.planetRadius)
            )
          )[0]
          .reduce((memo, { x, y, z }) => {
            memo.push(x, y, z);
            return memo;
          }, []);

        const polygonPoints = [];
        for (let i = 0; i < coords3d.length; i += 3) {
          const x = coords3d[i];
          const y = coords3d[i + 1];
          const z = coords3d[i + 2];
          polygonPoints.push(tempVector3.set(x, y, z).clone());
        }
        const hull = new ConvexGeometry(polygonPoints);

        const xyz = Array.from(hull.getAttribute("position").array);
        for (let i = 0; i < xyz.length; i += 3) {
          polygonColors.push(featureColor.r, featureColor.g, featureColor.b);
        }

        polygonVerts.push(...xyz);
      }

      meshRef.current.geometry.setAttribute(
        "position",
        new Float32BufferAttribute(polygonVerts, 3)
      );
      meshRef.current.geometry.setAttribute(
        "color",
        new Float32BufferAttribute(polygonColors, 3)
      );

      // const positions = sphereRef.current?.geometry.getAttribute("position");
      // const colors = [];
      // let lastNode = 0;
      // for (let i = 0; i < positions!.array.length; i += 3) {
      //   const x = positions.array[i];
      //   const y = positions.array[i + 1];
      //   const z = positions.array[i + 2];

      //   tempVector3.set(x, y, z).multiplyScalar(planet.planetRadius);
      //   const closestFeature = getClosest.findFromCartesian(
      //     tempVector3,
      //     lastNode
      //   );
      //   lastNode = closestFeature;
      //   // const feat = polygons.features[closestFeature];
      //   const color = colorMap[closestFeature];
      //   if (color) {
      //     colors.push(color.r, color.g, color.b);
      //   } else {
      //     colors.push(plainColor.r, plainColor.g, plainColor.b);
      //   }
      // }

      // sphereRef.current.geometry.setAttribute(
      //   "color",
      //   new Float32BufferAttribute(colors, 3)
      // );

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

      geoRef.current = {
        polygons,
        geo: geo()(longlat),
        d3: d3Stuff,
        longlat,
        colorMap,
        getClosest,
        neighbors: d3Stuff.neighbors,
      };

      console.log(geoRef.current);
    }
  }, [meshRef, planet, pointsRef, sphereRef]);

  const changeSelectedPolygonColor = (selectedIndex: number) => {
    geoRef.current.polygons.features[selectedIndex];
    const colorAttribute = meshRef.current.geometry.getAttribute("color");
  };

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
    if (geoRef.current) {
      const [long, lat] = cartesianToPolar(intersection);

      const selection = find(
        geoRef.current.d3.neighbors,
        geoRef.current.longlat,
        planet.planetRadius
      ).findFromPolar(long, lat);

      setSelected(selection);
    }
  };

  // React.useEffect(() => {
  //   meshRef.current?.children.forEach((child) => {
  //     // if (child.userData.type === "neighbor") {
  //     // }
  //     child.removeFromParent();
  //   });

  //   if (geoRef.current) {
  //     if (selected) {
  //       const neighbors = geoRef.current.neighbors[selected];
  //       if (neighbors) {
  //         neighbors.forEach((id: number) => {
  //           const neighborMesh = new Mesh(neighborGeo, neighborMaterial);
  //           const getPositionFromIndex = (index: number): Vector3 => {
  //             const [long, lat] =
  //               geoRef.current.polygons.features[index].properties.site;
  //             return polarToCartesian(lat, long, planet.planetRadius);
  //           };
  //           neighborMesh.position.copy(getPositionFromIndex(id));
  //           neighborMesh.userData = {
  //             type: "neighbor",
  //           };
  //           meshRef.current?.add(neighborMesh);
  //         });
  //       }
  //     }
  //   }
  // }, [selected, meshRef, geoRef]);

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
