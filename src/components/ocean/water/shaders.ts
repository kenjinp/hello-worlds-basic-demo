export const vert = /* glsl */ `  
  uniform float uWidth;
  uniform float uTime;
  uniform float uHeight;
  uniform float uSpeed;
  uniform vec4 waveA;
  uniform vec4 waveB;
  uniform vec4 waveC;

  uniform float offsetX;
  uniform float offsetZ;

  varying float vHeight;


  vec3 GerstnerWave (vec4 wave, vec3 p) {
      float steepness = wave.z;
      float wavelength = wave.w;
      float k = 2.0 * PI / wavelength;
      float c = sqrt(9.8 / k);
      vec2 d = normalize(wave.xy);
      float f = k * (dot(d, vec2(p.x, p.y)) - c * uTime);
      float a = steepness / k;

      return vec3(
          d.x * (a * cos(f)),
          d.y * (a * cos(f)),
          a * sin(f)
      );
  }

  void main() {
    vec3 localPosition = position;
    vec3 gridPoint = position.xyz;
    vec3 tangent = vec3(1, 0, 0);
    vec3 binormal = vec3(0, 0, 1);
    vec3 p = gridPoint;
    gridPoint.x += offsetX;//*2.0;
    gridPoint.y -= offsetZ;//*2.0;
    p += GerstnerWave(waveA, gridPoint);
    p += GerstnerWave(waveB, gridPoint);
    p += GerstnerWave(waveC, gridPoint);

    vHeight = gridPoint.y;
    csm_Position = p;
    csm_Normal = normal;
  }

`;

export const frag = /* glsl */ `
  varying float vHeight;

  uniform vec3 waterColor;
  uniform vec3 waterHighlight;

  uniform float offset;
  uniform float contrast;
  uniform float brightness;

  vec3 calcColor() {
    float mask = (pow(vHeight, 2.) - offset) * contrast;
    // vec3 diffuseColor = mix(waterColor, waterHighlight, vHeight);
    vec3 diffuseColor = waterColor;
    diffuseColor *= brightness;
    return diffuseColor;
  }

  void main() {
    csm_DiffuseColor = vec4(calcColor(), 1.0);   
  }
`;
