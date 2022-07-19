import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { Vector3 } from "three";

export const LightRig: React.FC = () => {
  return (
    <mesh>
      <directionalLight
        color={0xffffff}
        intensity={0.4}
        position={new Vector3(-1, 0.75, 1).multiplyScalar(10_000)}
        castShadow
      />
    </mesh>
  );
};

export const BasicScene: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <Canvas
      onCreated={
        (state) => state.gl.setClearColor("black") //wie die nacht
      }
      gl={{ logarithmicDepthBuffer: true }}
      camera={{
        near: 0.01,
        far: 100_000_000,
      }}
      shadows
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    >
      <React.Suspense fallback={null}>
        {children}
        <LightRig />
      </React.Suspense>
    </Canvas>
  );
};

export default BasicScene;
