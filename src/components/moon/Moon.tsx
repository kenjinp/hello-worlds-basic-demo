import { OrbitCamera, Planet } from "@hello-worlds/react";
import { Stars } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import * as React from "react";
import { MathUtils, Vector3 } from "three";
import { MoonAtmosphere } from "./Moon.atmosphere";
import { randomBias, randomSpherePoint } from "./Moon.math";
import { ThreadParams } from "./Moon.worker";
import planetWorker from "./Moon.worker?worker";

const tempVector3 = new Vector3();

const actualMoonSize = 1_700_000;

const Moon: React.FC = () => {
  const planet = useControls("planet", {
    invert: false,
    planetRadius: {
      min: 10,
      max: 7_000_000,
      value: 5_000,
      step: 10,
    },
    minCellSize: {
      min: 0,
      max: 10_000_000,
      value: 25,
      step: 10,
    },
    minCellResolution: {
      min: 0,
      max: 10_000_000,
      value: 128,
      step: 10,
    },
  });

  const ocean = useControls("ocean", {
    seaLevel: {
      min: -100,
      max: 100,
      value: 50,
      step: 1,
    },
  });

  const crater = useControls("craters", {
    numberOfCraters: {
      min: 1,
      max: 5000,
      value: 1000,
      step: 1,
    },
    minRadius: {
      min: 1,
      max: planet.planetRadius / 2,
      value: 10,
      step: 1,
    },
    maxRadius: {
      min: 1,
      max: planet.planetRadius / 2,
      value: 200,
      step: 1,
    },
    rimWidth: {
      min: 0,
      max: 2,
      value: 0.7,
      step: 0.001,
    },
    rimSteepness: {
      min: 0,
      max: 2,
      value: 0.8,
      step: 0.001,
      // step: 1,
    },
    smoothness: {
      min: 0,
      max: 10,
      value: 0.3,
      step: 0.001,
      // step: 1,
    },
  });

  const { camera } = useThree();

  const randomPointsOnSphere: ThreadParams["randomPoints"] =
    React.useMemo(() => {
      return Array(crater.numberOfCraters)
        .fill(0)
        .map(() => {
          const [x, y, z] = randomSpherePoint(0, 0, 0, planet.planetRadius);
          const randomRadius = randomBias(
            10,
            planet.planetRadius / 10,
            15,
            0.9
          );
          return {
            floorHeight: MathUtils.randFloat(-1, 0),
            radius: randomRadius,
            center: tempVector3.set(x, y, z).clone(),
          };
        });
    }, [planet.planetRadius, crater]);

  return (
    <Planet
      planetProps={{
        radius: planet.planetRadius,
        minCellSize: planet.minCellSize,
        minCellResolution: planet.minCellResolution,
        invert: planet.invert,
      }}
      lodOrigin={camera.position}
      worker={planetWorker}
      data={{
        randomPoints: randomPointsOnSphere,
        rimWidth: crater.rimWidth,
        rimSteepness: crater.rimSteepness,
        smoothness: crater.smoothness,
      }}
    >
      <OrbitCamera />
      <group
        scale={new Vector3(1, 1, 1)
          .multiplyScalar(planet.planetRadius)
          .multiplyScalar(100)}
      >
        <Stars />
      </group>
      <EffectComposer>
        <MoonAtmosphere />
      </EffectComposer>
      {/* <Ocean seaLevel={ocean.seaLevel} radius={planet.planetRadius} /> */}
    </Planet>
  );
};

export default Moon;
