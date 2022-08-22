import { OrbitCamera, usePlanet } from "@hello-worlds/react";
import { Stars } from "@react-three/drei";
import { Vector3 } from "three";
import BasicScene from "./components/basic-scene/BasicScene";
import Moon from "./components/moon/Moon";
import { Planet } from "./components/planet/Planet";

const StarMap = () => {
  const planet = usePlanet();
  return (
    <group
      scale={new Vector3(1, 1, 1)
        .multiplyScalar(planet.planetProps.radius)
        .multiplyScalar(100)}
    >
      <Stars />
    </group>
  );
};

export default function App() {
  return (
    <div className="App">
      <BasicScene>
        {/* <Html>
          <a href="https://github.com/kenjinp/hello-worlds" target="_blank">
            <button>Hello Worlds (github)</button>
          </a>
        </Html> */}
        <group>
          {/* <OrbitControls /> */}
          <Planet>
            <OrbitCamera />
            <StarMap />
          </Planet>
          <group position={new Vector3(100_000, 100_000, 0)}>
            <Moon />
          </group>
        </group>
      </BasicScene>
    </div>
  );
}
