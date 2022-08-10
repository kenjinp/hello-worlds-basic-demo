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
      const edge = edges[i];
      const edgeColor = new Color(Math.random() * 0xffffff);
      for (let j = 0; j < edge.coordinates.length; j++) {
        n++;
        o.position.copy(edge.coordinates[j]);

        o.lookAt(origin);
        o.rotateX((90 * Math.PI) / 180);

        o.updateMatrixWorld();
        instancesRef.current.setMatrixAt(n, o.matrixWorld);
        instancesRef.current.setColorAt(n, edgeColor);
      }
    }

    instancesRef.current.count = n;
    instancesRef.current.instanceMatrix.needsUpdate = true;
    instancesRef.current.instanceColor!.needsUpdate = true;
  }

  React.useEffect(updateInstances, [tectonics.edges]);

  return (
    <group>
      {/* {Labels} */}
      <instancedMesh ref={instancesRef} args={[null, null, 100_000]}>
        <sphereBufferGeometry args={[100, 32, 32]} />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  );
};
