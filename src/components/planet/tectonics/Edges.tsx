import { useFrame } from "@react-three/fiber";
import * as React from "react";
import {
  Color,
  InstancedMesh,
  LineBasicMaterial,
  Object3D,
  Vector3,
} from "three";
import { useTectonics } from "./TectonicsComponent";

const material = new LineBasicMaterial({ color: 0x0000ff });

export const EdgeLines: React.FC = () => {
  const tectonics = useTectonics();

  return (
    <group>
      {tectonics.edges.map((edge, i) => {
        if (!edge) return void console.warn("plate not found", i);

        return (
          <line key={`edge-${i}`}>
            <primitive attach="material" object={material} />
            <bufferGeometry>
              <float32BufferAttribute
                attach={(parent, self) => (
                  parent.setAttribute("position", self),
                  () => parent.deleteAttribute("position")
                )}
                args={[edge.coordinates, 3]}
              />
            </bufferGeometry>
          </line>
        );
      })}
    </group>
  );
};

const origin = new Vector3();
const tempVector3 = new Vector3();
export const EdgePoints: React.FC = () => {
  const tectonics = useTectonics();
  const instancesRef = React.useRef<InstancedMesh>(null!);
  const [o] = React.useState(() => new Object3D());

  function updateInstances() {
    if (!instancesRef.current) return;

    let n = 0;
    const edges = Array.from(tectonics.edges.values());
    for (let i = 0; i < edges.length; i += 1) {
      for (let j = 0; j < edges[i].coordinates.length; j++) {
        n++;
        o.position.copy(edges[i].coordinates[j].clone());
        // console.log(tectonics.edges[i].calculateBoundaryStress(o.position));

        // const normal = tempVector3.clone().subVectors(o.position, origin);
        // o.rotation.setFromVector3(normal);
        o.lookAt(origin);
        o.rotateX((90 * Math.PI) / 180);
        // o.rotation.x = Math.PI / 2;
        // o.rotateX((90 * Math.PI) / 2);
        // o.scale.setScalar(50);

        o.updateMatrixWorld();
        instancesRef.current.setMatrixAt(i, o.matrixWorld);
      }
    }

    instancesRef.current.count = n;
    instancesRef.current.instanceMatrix.needsUpdate = true;
  }

  // React.useEffect(updateInstances, [tectonics.edges]);

  useFrame(updateInstances);

  const Labels = React.useMemo(
    () => (
      <>
        {Array.from(tectonics.edges.values()).map((edge, i) => {
          const blahs = Array.from(edge.coordinates.values());
          const edgeColor = new Color(Math.random() * 0xffffff);
          return (
            <React.Fragment key={`edge-${JSON.stringify(edge)}`}>
              {blahs.map((coordinates, i) => {
                return (
                  <React.Fragment
                    key={`whatever-${JSON.stringify(coordinates)}`}
                  >
                    <mesh position={coordinates}>
                      <sphereGeometry args={[100, 32, 32]} />
                      <meshBasicMaterial color={edgeColor} />
                    </mesh>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </>
    ),
    [tectonics.edges]
  );

  return (
    <group>
      {Labels}
      <instancedMesh ref={instancesRef} args={[null, null, 100_000]}>
        <cylinderBufferGeometry args={[200, 100, 1000, 5, 4]} />
        <meshNormalMaterial />
      </instancedMesh>
    </group>
  );
};
