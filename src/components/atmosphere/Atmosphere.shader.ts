const shader = /* glsl */ `
float densityAtPoint(vec2 densitySamplePoint) {
	float planetRadius = 1;
	float2 planetCentre = 0;

	float heightAboveSurface = length(densitySamplePoint - planetCentre) - planetRadius;
	float height01 = heightAboveSurface / (atmosphereRadius - planetRadius);
	float localDensity = exp(-height01 * densityFalloff) * (1 - height01);
	return localDensity;
}

float opticalDepth(vec2 rayOrigin, vec2 rayDir, float rayLength) {
	int numOpticalDepthPoints = numOutScatteringSteps;

	float2 densitySamplePoint = rayOrigin;
	float stepSize = rayLength / (numOpticalDepthPoints - 1);
	float opticalDepth = 0;

	for (int i = 0; i < numOpticalDepthPoints; i ++) {
		float localDensity = densityAtPoint(densitySamplePoint);
		opticalDepth += localDensity * stepSize;
		densitySamplePoint += rayDir * stepSize;
	}
	return opticalDepth;
}


float calculateOutScattering(vec2 inPoint, vec2 outPoint) {
	float planetRadius = 1;
	float skinWidth = planetRadius / 1000.0;
	

	float lightTravelDst = length(outPoint - inPoint);
	vec2 outScatterPoint = inPoint;
	vec2 rayDir = (outPoint - inPoint) / lightTravelDst;
	float stepSize = (lightTravelDst - skinWidth) / (numOutScatteringSteps);
	
	float outScatterAmount = 0;

	for (int i = 0; i < numOutScatteringSteps; i ++) {
		outScatterPoint += rayDir * stepSize;

		// height at planet surface = 0, at furthest extent of atmosphere = 1
		float height = length(outScatterPoint - 0) - planetRadius;//

	
		
		float height01 = saturate(height / (atmosphereRadius - planetRadius));
		outScatterAmount += exp(-height01 * densityFalloff) * stepSize;
		
	}

	return outScatterAmount;
}

`;

export const fragmentShader = /* glsl */ `
  #ifdef FRAMEBUFFER_PRECISION_HIGH

    uniform mediump sampler2D map;

  #else

    uniform lowp sampler2D map;

  #endif
  
  
  uniform vec3 uViewVector;
  uniform vec3 uWorldspaceCameraPosition;
  varying vec3 vWorldPosition;
  // blah
  uniform vec2 uResolution;
  uniform float uFov;


  float maxFloatValue = 99999999999999.0;
  // returns vector (distanceToSphere, distanceThroughSphere) 
  // if ray origin is inside sphere, distanceToSphere = 0;
  // if ray misses sphere, distanceToSphere = maxValue; distanceThroughSphere = 0;
  vec2 raySphere(vec3 sphereCenter, float sphereRadius, vec3 rayOrigin, vec3 rayDir) {
    vec3 offset = rayOrigin - sphereCenter;
    float a = dot(rayDir, rayDir); // set to dot(rayDir, rayDir) if rayDir might not be normalized
    float b = 2.0 * dot(offset, rayDir);
    float c = dot(offset, offset) - sphereRadius * sphereRadius;
    float d = b * b - 4.0 * a * c; // Discriminant from quadratic formula;

    // NMumber of intersections: 0 when d < 0; 1 when d = 0; 2 when d > 0
    if (d > 0.0) {
      float s = sqrt(d);
      float distanceToSphereNear = max(0.0, (-b -s) / (2.0 * a));
      float distanceToSphereFar = (-b + s) / (2.0 * a);

      // Ignore intersections that occur behind the ray
      if (distanceToSphereFar >= 0.0) {
        return vec2(distanceToSphereNear, distanceToSphereFar - distanceToSphereNear);
      }
    }

    // Ray did not intersect sphere
    return vec2(maxFloatValue, 0.0);
  }

  vec2 squareFrame(vec2 screenSize) {
    vec2 position = 2.0 * (gl_FragCoord.xy / screenSize.xy) - 1.0;
    position.x *= screenSize.x / screenSize.y;
    return position;
  }
  vec2 squareFrame(vec2 screenSize, vec2 coord) {
    vec2 position = 2.0 * (coord.xy / screenSize.xy) - 1.0;
    position.x *= screenSize.x / screenSize.y;
    return position;
  }
  
  //https://github.com/stackgl/glsl-look-at/blob/gh-pages/index.glsl
  
  mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
    vec3 rr = vec3(sin(roll), cos(roll), 0.0);
    vec3 ww = normalize(target - origin);
    vec3 uu = normalize(cross(ww, rr));
    vec3 vv = normalize(cross(uu, ww));
    return mat3(uu, vv, ww);
  }
  
  //https://github.com/stackgl/glsl-camera-ray
  
  vec3 getRay(mat3 camMat, vec2 screenPos, float lensLength) {
    return normalize(camMat * vec3(screenPos, lensLength));
  }
  vec3 getRay(vec3 origin, vec3 target, vec2 screenPos, float lensLength) {
    mat3 camMat = calcLookAtMatrix(origin, target, 0.0);
    return getRay(camMat, screenPos, lensLength);
  }


  // float3 viewVector = mul(unity_CameraInvProjection, float4(v.uv * 2 - 1, 0, -1));

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    vec4 originalColor = texture2D(map, uv);

    vec2  screenPos    = squareFrame( uResolution );
    vec3  rayDirection = getRay( uWorldspaceCameraPosition, uViewVector, screenPos, 2.0 );

    // how do we get ray at position?
    // float width = uWidth;
    // float height = uHeight;
    // float aspect = width / height;
    // vec3 nearPlanePosition = vec3((gl_FragCoord.x - 0.5 * width) / width * 2.0  * aspect,
    //                   (gl_FragCoord.y - 0.5 * height) / height * 2.0,
    //                    0.0);
  
    // vec3 viewDirection = normalize(nearPlanePosition - uWorldspaceCameraPosition);


    float atmosphereRadius = 4050.0;
    vec3 rayOrigin = uWorldspaceCameraPosition;
    vec3 rayDir = rayDirection; //normalize(uViewVector);

    vec3 planetOrigin = vec3(0.0, 0.0, 0.0);
    vec2 hitInfo = raySphere(planetOrigin, atmosphereRadius, rayOrigin, rayDir);

    float distanceToAtmosphere = hitInfo.x;
    float distanceThroughAtmosphere = hitInfo.y;

    float whatever = distanceThroughAtmosphere / (atmosphereRadius * 2.0);
    vec4 testColor = vec4(whatever, whatever, whatever, 1.0);
    outputColor = testColor;
  }
`;

// This is like a helper, only used to expose some world position coordinates
export const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void mainSupport(const in vec2 uv) {
    vWorldPosition = position;
  }
`;
