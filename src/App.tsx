import { Html } from "@react-three/drei";
import BasicScene from "./components/basic-scene/BasicScene";
import Moon from "./components/moon/Moon";

export default function App() {
  return (
    <div className="App">
      <BasicScene>
        <Html>
          <a href="https://github.com/kenjinp/hello-worlds" target="_blank">
            <button>Hello Worlds (github)</button>
          </a>
        </Html>
        <Moon></Moon>
      </BasicScene>
    </div>
  );
}
