import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { Vector3 } from "three";

const AU = 149_597_870_700;

export const LightRig: React.FC = () => {
  return (
    <mesh position={new Vector3(-1, 0.75, 1).multiplyScalar(AU / 20)}>
      <directionalLight color={0xffffff} intensity={1.0} castShadow />
      <sphereGeometry args={[600_000_000 / 4, 32, 16]}></sphereGeometry>
      <meshStandardMaterial
        color={0xfdfbd3}
        emissive={0xfdfbd3}
        emissiveIntensity={40.0}
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
        far: Number.MAX_SAFE_INTEGER,
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
