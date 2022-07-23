import { Planet, usePlanet } from "@hello-worlds/react";
import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import oceanWorker from "./Ocean.worker?worker";
import GerstnerWaterMaterial from "./water/GerstnerWater";

const Water: React.FC = () => {
  const planet = usePlanet();
  const mat = React.useRef<GerstnerWaterMaterial>(new GerstnerWaterMaterial());

  React.useEffect(() => {
    planet.material = mat.current.material;
  }, [planet]);

  useFrame((_, dt) => {
    mat.current.update(dt);
  });

  return null;
};

const Ocean: React.FC<{ seaLevel: number; radius: number }> = ({
  seaLevel,
  radius,
}) => {
  const { camera } = useThree();

  return (
    <Planet
      planetProps={{
        radius,
        minCellSize: 48,
        minCellResolution: 24,
        invert: false,
      }}
      lodOrigin={camera.position}
      worker={oceanWorker}
      data={{
        seaLevel,
      }}
    >
      <Water />
    </Planet>
  );
};

export default Ocean;
