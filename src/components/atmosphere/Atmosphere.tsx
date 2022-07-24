import { useFrame, useThree } from "@react-three/fiber";
import { Effect, EffectAttribute } from "postprocessing";
import { forwardRef, useMemo } from "react";
import { Camera, Uniform, Vector2, Vector3, WebGLRenderer } from "three";
import { fragmentShader, vertexShader } from "./Atmosphere.shader";

let _uParam: any;

// Effect implementation
class MyCustomEffectImpl extends Effect {
  camera: Camera;
  atmosphereRadius: number;
  planetOrigin: Vector3;
  sunDir: Vector3;
  constructor({
    camera,
    renderer,
    planetOrigin,
    planetRadius,
    sunDir,
    atmosphereRadius,
  }: {
    camera: Camera;
    renderer: WebGLRenderer;
    planetOrigin: Vector3;
    atmosphereRadius: number;
    planetRadius: number;
    sunDir: Vector3;
  }) {
    const height = renderer.domElement.clientHeight;
    const width = renderer.domElement.clientWidth;
    const viewVector = new Vector3();
    camera.getWorldDirection(viewVector);

    super("MyCustomEffect", fragmentShader, {
      uniforms: new Map([
        ["uWorldspaceCameraPosition", new Uniform(camera.position)],
        ["uViewVector", new Uniform(viewVector)],
        ["uResolution", new Uniform(new Vector2(width, height))],
        ["uFov", new Uniform(camera?.fov || 45)],
        ["uAtmosphereRadius", new Uniform(atmosphereRadius)],
        ["uPlanetOrigin", new Uniform(planetOrigin)],
        ["uPlanetRadius", new Uniform(planetRadius)],
        ["uDirToSun", new Uniform(sunDir)],
      ]),
      attributes: EffectAttribute.DEPTH,
      vertexShader: vertexShader,
    });

    this.camera = camera;
    this.planetOrigin = planetOrigin;
    this.atmosphereRadius = atmosphereRadius;
    this.sunDir = sunDir;
  }

  updateProps({
    atmosphereRadius,
    sunDir,
  }: {
    atmosphereRadius: number;
    sunDir: Vector3;
  }) {
    this.atmosphereRadius = atmosphereRadius;
    this.sunDir = sunDir;
  }

  update() {
    const viewVector = new Vector3();
    this.camera.getWorldDirection(viewVector);
    this.uniforms.get("uViewVector").value = viewVector;
    this.uniforms.get("uWorldspaceCameraPosition").value = this.camera.position;
    this.uniforms.get("uAtmosphereRadius").value = this.atmosphereRadius;
    this.uniforms.get("uDirToSun").value = this.sunDir;
  }
}

// Effect component
export const AtmosphereEffect = forwardRef<
  ThreeElements.primitive,
  {
    planetOrigin: Vector3;
    atmosphereRadius: number;
    planetRadius: number;
    sunPosition: Vector3;
  }
>(({ planetOrigin, atmosphereRadius, planetRadius, sunPosition }, ref) => {
  const { camera, gl } = useThree();

  const getSunDir = () => {
    const oldLookatViewVector = new Vector3();
    camera.getWorldDirection(oldLookatViewVector);
    camera.lookAt(sunPosition);
    const sunDir = new Vector3();
    camera.getWorldDirection(sunDir);
    camera.lookAt(oldLookatViewVector);
    return sunDir;
  };

  const effect = useMemo(() => {
    return new MyCustomEffectImpl({
      camera,
      renderer: gl,
      planetOrigin,
      atmosphereRadius,
      sunDir: getSunDir(),
      planetRadius,
    });
  }, [camera, gl, planetOrigin, atmosphereRadius]);

  useFrame(() => {
    effect.updateProps({ atmosphereRadius, sunDir: getSunDir() });
  });

  return <primitive ref={ref} object={effect} dispose={null} />;
});
