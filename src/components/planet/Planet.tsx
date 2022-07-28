import { useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as React from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { Planet as D3Planet } from "./Planet.d3";
import { makeSphere } from "./Planet.geometry.js";
import { randomColor } from "./Planet.utils";
const Planet: React.FC = () => {
  const planet = useControls("planet", {
    planetRadius: {
      min: 100,
      max: 5_000 * 4,
      value: 5_000 * 4,
      step: 10,
    },
    jitter: 1.0,
    numberPoints: 1000,
  });

  const { camera } = useThree();

  const meshRef = React.useRef<Mesh>(null);

  React.useEffect(() => {
    if (meshRef.current) {
      const result = makeSphere(
        planet.numberPoints,
        planet.jitter,
        Math.random
      );

      const map = {};
      const mesh = result.mesh;
      map.r_xyz = result.r_xyz;
      map.t_xyz = generateTriangleCenters(mesh, map);

      /* Calculate the centroid and push it onto an array */
      function pushCentroidOfTriangle(out, ax, ay, az, bx, by, bz, cx, cy, cz) {
        // TODO: renormalize to radius 1
        out.push((ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3);
      }

      function generateTriangleCenters(mesh, { r_xyz }) {
        let { numTriangles } = mesh;
        let t_xyz = [];
        for (let t = 0; t < numTriangles; t++) {
          let a = mesh.s_begin_r(3 * t),
            b = mesh.s_begin_r(3 * t + 1),
            c = mesh.s_begin_r(3 * t + 2);
          pushCentroidOfTriangle(
            t_xyz,
            r_xyz[3 * a],
            r_xyz[3 * a + 1],
            r_xyz[3 * a + 2],
            r_xyz[3 * b],
            r_xyz[3 * b + 1],
            r_xyz[3 * b + 2],
            r_xyz[3 * c],
            r_xyz[3 * c + 1],
            r_xyz[3 * c + 2]
          );
        }
        return t_xyz;
      }

      const tmpColor = new Color(0xffffff);

      function r_color_fn() {
        // let m = map.r_moisture[r];
        // let e = map.r_elevation[r];
        tmpColor.setHex(Math.random() * 0xffffff);
        return tmpColor;
      }

      function generateVoronoiGeometry(mesh, { r_xyz, t_xyz }, r_color_fn) {
        const { numSides } = mesh;
        let xyz = [],
          colors = [];

        for (let s = 0; s < numSides; s++) {
          let inner_t = mesh.s_inner_t(s),
            outer_t = mesh.s_outer_t(s),
            begin_r = mesh.s_begin_r(s);

          const whatever = mesh.s_begin_r(s);

          let rgb = randomColor(whatever)!;
          xyz.push(
            t_xyz[3 * inner_t],
            t_xyz[3 * inner_t + 1],
            t_xyz[3 * inner_t + 2],
            t_xyz[3 * outer_t],
            t_xyz[3 * outer_t + 1],
            t_xyz[3 * outer_t + 2],
            r_xyz[3 * begin_r],
            r_xyz[3 * begin_r + 1],
            r_xyz[3 * begin_r + 2]
          );
          colors.push(
            ...Array(9)
              .fill(0)
              .reduce((memo, entry) => [...memo, rgb.r, rgb.g, rgb.b], [])
          );
        }
        return { xyz, colors };
      }

      const v = generateVoronoiGeometry(mesh, map, r_color_fn);

      console.log({
        result,
        map,
        voronoi: v,
        // regionVertexMap,
      });
      const geometry = new BufferGeometry();
      const vertices = new Float32Array(v.xyz);
      geometry.setAttribute("position", new BufferAttribute(vertices, 3));
      geometry.setAttribute("color", new Float32BufferAttribute(v.colors, 3));
      meshRef.current.geometry = geometry;

      const pointGeo = new BufferGeometry();
      pointGeo.setAttribute(
        "position",
        new Float32BufferAttribute(map.r_xyz, 3)
      );

      const pointsMat = new PointsMaterial({ color: 0xffffff });

      const points = new Points(pointGeo, pointsMat);
      pointsMat.size = 100;
      meshRef.current.add(points);
    }
  }, [meshRef, planet]);

  React.useEffect(() => {
    camera.position.copy(
      new Vector3(planet.planetRadius * 1.5, 0, planet.planetRadius * 1.5)
    );
    camera.lookAt(new Vector3(0, 0, 0));
  }, [planet.planetRadius]);

  return (
    <group>
      <mesh
        ref={meshRef}
        scale={
          new Vector3(
            planet.planetRadius,
            planet.planetRadius,
            planet.planetRadius
          )
        }
      >
        <D3Planet />
        {/* <sphereBufferGeometry  */}
        {/* <sphereGeometry args={[planet.planetRadius, 32, 16]}></sphereGeometry> */}
        <meshBasicMaterial vertexColors side={DoubleSide} />
      </mesh>
    </group>
  );
};

export default Planet;
