import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import BasicScene from "./components/basic-scene/BasicScene";
import Moon from "./components/moon/Moon";
import { Planet } from "./components/planet/Planet";

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
          <OrbitControls />
          <Planet />
          <group position={new Vector3(100_000, 100_000, 0)}>
            <Moon />
          </group>
        </group>
      </BasicScene>
    </div>
  );
}
