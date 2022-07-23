import { Canvas } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import * as React from "react";
import { Vector3 } from "three";
import { AtmosphereEffect } from "../atmosphere/Atmosphere";

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
      <EffectComposer>
        <AtmosphereEffect />
        {/* <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} /> */}
        <React.Suspense fallback={null}>
          {children}
          <LightRig />
        </React.Suspense>
      </EffectComposer>
    </Canvas>
  );
};

export default BasicScene;
