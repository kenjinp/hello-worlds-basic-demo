import { usePlanet } from "@hello-worlds/react";
import { useControls } from "leva";
import * as React from "react";
import { Vector3 } from "three";
import { AtmosphereEffect } from "../atmosphere/Atmosphere";

export const MoonAtmosphere: React.FC = () => {
  const planet = usePlanet();
  const atmosphere = useControls("atmosphere", {
    atmosphereRadius: {
      min: 1,
      max: 10_000,
      value: 4_050,
      step: 1,
    },
  });

  return (
    <AtmosphereEffect
      planetOrigin={planet.rootGroup.position}
      planetRadius={planet.planetProps.radius}
      sunPosition={new Vector3(-1, 0.75, 1).multiplyScalar(10_000)}
      atmosphereRadius={atmosphere.atmosphereRadius}
    />
  );
};
