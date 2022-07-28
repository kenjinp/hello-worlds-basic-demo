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
import earcut from "earcut";
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
        (memo, entry, index) => {
          console.log({ feature: entry });
          const featureColor = tmpColor.setHex(Math.random() * 0xffffff);
          const [lon, lat] = entry.properties.site;
          const { x, y, z } = polarToCartesian(lat, lon, planet.planetRadius);

          memo.points.push(x, y, z);
          memo.pointsColors.push(
            featureColor.r,
            featureColor.g,
            featureColor.b
          );

          // const vals = makePolygon(
          //   entry.geometry.coordinates,
          //   planet.planetRadius
          // );

          console.log({
            coords: entry.geometry.coordinates[0],
          });

          const verts = entry.geometry.coordinates[0]
            .map(([long, lat]) =>
              polarToCartesian(lat, long, planet.planetRadius)
            )
            .map(({ x, y, z }) => [x, y, z])
            .reduce((memo, entry) => {
              memo.push(...entry);
              return memo;
            }, []);

          const triangles = earcut(verts, null, 3);

          const dedupedVerts = verts.reduce((memo, entry) => {
            if (!memo.includes(entry)) {
              memo.push(entry);
            }
            return memo;
          }, []);

          console.log({ verts, dedupedVerts, triangles });

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

      meshRef.current.geometry.setAttribute(
        "position",
        new Float32BufferAttribute(values.polygonVerts, 3)
      );
      meshRef.current.geometry.setAttribute(
        "color",
        new Float32BufferAttribute(values.polygonColors, 3)
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

      console.log({
        geo,
        d3: d3.geoDelaunay(latlong),
        triangles: geo()(latlong).triangles(),
        mesh: geo()(latlong).mesh(),
        poly: geo()(latlong).polygons(),
        values,
        latlong,
      });
      geoRef.current = {
        polygons,
        geo: geo()(latlong),
        d3: d3.geoDelaunay(latlong),
        values,
        latlong,
      };
    }
  }, [meshRef, planet, pointsRef]);

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

      const kennyFind = find(
        geoRef.current.d3.neighbors,
        geoRef.current.latlong,
        planet.planetRadius
      )(long, lat);

      const geo = geoRef.current.geo.find(long, lat);
      const d3delany = geoRef.current.d3.find(long, lat);
      console.log({ geo, d3delany, kennyFind });

      setSelected(kennyFind);
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
          onClick={handlePointer}
        >
          <sphereGeometry></sphereGeometry>
          <meshBasicMaterial color="green" visible={false} />
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
