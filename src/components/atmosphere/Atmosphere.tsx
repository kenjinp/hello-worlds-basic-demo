import { useThree } from "@react-three/fiber";
import { Effect, EffectAttribute } from "postprocessing";
import { forwardRef, useMemo } from "react";
import { Camera, Uniform, Vector2, Vector3, WebGLRenderer } from "three";
import { fragmentShader, vertexShader } from "./Atmosphere.shader";

let _uParam: any;

// Effect implementation
class MyCustomEffectImpl extends Effect {
  camera: Camera;
  constructor({
    camera,
    renderer,
  }: {
    camera: Camera;
    renderer: WebGLRenderer;
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
      ]),
      attributes: EffectAttribute.DEPTH,
      vertexShader: vertexShader,
    });
    this.camera = camera;
  }

  update() {
    const viewVector = new Vector3();
    this.camera.getWorldDirection(viewVector);
    this.uniforms.get("uViewVector").value = viewVector;
    this.uniforms.get("uWorldspaceCameraPosition").value = this.camera.position;
  }
}

// Effect component
export const AtmosphereEffect = forwardRef((_unused_props, ref) => {
  const { camera, gl } = useThree();
  const effect = useMemo(
    () => new MyCustomEffectImpl({ camera, renderer: gl }),
    [camera, gl]
  );
  return <primitive ref={ref} object={effect} dispose={null} />;
});
