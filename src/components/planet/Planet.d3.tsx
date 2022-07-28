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

  React.useEffect(() => {
    if (meshRef.current) {
      setSphere(new Sphere(meshRef.current.position, planet.planetRadius));

      const latlong = generateFibonacciSphereAlt(
        planet.numberPoints,
        planet.jitter,
        Math.random
      );

      const geo = d3.geoVoronoi(latlong);
      const polygons = geo.polygons(latlong);
      console.log({ polygons });
      const tmpColor = new Color(0xffffff);
      const values = polygons.features.reduce(
        (memo, entry) => {
          console.log({ feature: entry });
          const featureColor = tmpColor.setHex(Math.random() * 0xffffff);
          const [lon, lat] = entry.properties.site;
          // pushCartesianFromSpherical(memo.points, lat, long);
          const { x, y, z } = polarToCartesian(lat, lon, planet.planetRadius);

          memo.points.push(x, y, z);
          memo.pointsColors.push(
            featureColor.r,
            featureColor.g,
            featureColor.b
          );
          // we need a triangle made of 3 points
          // this entry
          // this entry + 1
          // feature xyz (centroid)

          // append color to colors * 3 (one for each vertex)

          // next
          // const arrayOfLatLongsOfPolygonVertexes =
          //   entry.geometry.coordinates[0];
          // if (entry.geometry.coordinates[1]) {
          //   throw new Error("Did not expect this value");
          // }

          // this seems to work for triangles!
          // entry.geometry.coordinates.forEach((t) => {
          //   t.slice(0, 3).map((v) => {
          //     const vec0 = polarToCartesian(v[1], v[0], planet.planetRadius);
          //     memo.verts.push(vec0.x, vec0.y, vec0.z);
          //     memo.vertColors.push(
          //       featureColor.r,
          //       featureColor.g,
          //       featureColor.b
          //     );
          //   });
          // });
          // // for (let i = 0; i < arrayOfLatLongsOfPolygonVertexes.length; i++) {
          //   //   //   // first triangle point
          //   const triangleVertex = arrayOfLatLongsOfPolygonVertexes[i];

          //   const vec0 = polarToCartesian(
          //     triangleVertex[0],
          //     triangleVertex[1],
          //     planet.planetRadius
          //   );
          //   memo.points.push(vec0.x, vec0.y, vec0.z);
          //   memo.colors.push(featureColor.r, featureColor.g, featureColor.b);
          //   // // second triangle point
          //   // let triangleVertex1 = arrayOfLatLongsOfPolygonVertexes[i + 1];
          //   // if (!triangleVertex1) {
          //   //   triangleVertex1 = arrayOfLatLongsOfPolygonVertexes[0];
          //   // }
          //   // const vec1 = polarToCartesian(
          //   //   triangleVertex1[1],
          //   //   triangleVertex1[0],
          //   //   planet.planetRadius
          //   // );
          //   // memo.points.push(vec1.x, vec1.y, vec1.z);
          //   // memo.colors.push(featureColor.r, featureColor.g, featureColor.b);
          //   // if (i % 2) {
          //   //   // centroid point
          //   //   const vec3 = polarToCartesian(lon, lat, planet.planetRadius);
          //   //   memo.verts.push(vec3.x, vec3.y, vec3.z);
          //   //   memo.colors.push(featureColor.r, featureColor.g, featureColor.b);
          //   // }
          // }
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
      //   new Float32BufferAttribute(values.verts, 3)
      // );
      // meshRef.current.geometry.setAttribute(
      //   "color",
      //   new Float32BufferAttribute(values.vertColors, 3)
      // );

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

      console.log({
        geo,
        d3: d3.geoDelaunay(latlong),
        triangles: geo()(latlong).triangles(),
        mesh: geo()(latlong).mesh(),
        poly: geo()(latlong).polygons(),
        values,
      });
      geoRef.current = {
        polygons,
        geo,
        d3: d3.geoDelaunay(latlong),
        values,
      };
    }
  }, [meshRef, planet, pointsRef]);

  React.useEffect(() => {
    camera.position.copy(
      new Vector3(planet.planetRadius * 1.5, 0, planet.planetRadius * 1.5)
    );
    camera.lookAt(new Vector3(0, 0, 0));
  }, [planet.planetRadius]);

  // const handlePointer = (e) => {
  //   e.ray.intersectSphere(sphere, target);
  //   const intersection = target.multiplyScalar(planet.planetRadius).clone();
  //   setTarget(intersection);
  //   if (geoRef.current) {
  //     const [lat, long] = vector3toLonLat(intersection);
  //     console.log(geoRef.current.geo.find(lat, long));
  //   }
  // };

  return (
    <group>
      <mesh
        frustumCulled={false}
        ref={meshRef}
        // scale={
        //   new Vector3(
        //     planet.planetRadius,
        //     planet.planetRadius,
        //     planet.planetRadius
        //   )
        // }
        // onClick={handlePointer}
      >
        <Html>
          <p>target longlat: {cartesianToPolar(target).join(" ,")}</p>
          <p>radius: {sphere?.radius}</p>
          <p>target xyz: {[target.x, target.y, target.z].join(", ")}</p>
        </Html>
        <points>
          <pointsMaterial size={planet.pointsSize} vertexColors />
          <bufferGeometry ref={pointsRef} />
        </points>
        <bufferGeometry />
        {/* <sphereGeometry /> */}
        {/* <sphereBufferGeometry  */}
        {/* <sphereGeometry args={[planet.planetRadius, 32, 16]}></sphereGeometry> */}
        <meshBasicMaterial side={DoubleSide} wireframe />
      </mesh>
    </group>
  );
};
