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
  // planet info
  uniform float uAtmosphereRadius;
  uniform vec3 uPlanetOrigin;
  uniform float uPlanetRadius;
  uniform vec3 uDirToSun;

  // atmosphere info
  float densityFalloff = 15.0;
  int numOpticalDepthPoints = 10;
  int numInScatterPoints = 10;
  


  float densityAtPoint(vec3 densitySamplePoint) {
    float planetRadius = uPlanetRadius;
    float heightAboveSurface = length(densitySamplePoint - uPlanetOrigin) - planetRadius;
    float height01 = heightAboveSurface / (uAtmosphereRadius - planetRadius);
    float localDensity = exp(-height01 * densityFalloff) * (1. - height01);
    return localDensity;
  }


  float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 densitySamplePoint = rayOrigin;
    float stepSize = rayLength / float(numOpticalDepthPoints - 1);
    float opticalDepth = 0.;
  
    for (int i = 0; i < numOpticalDepthPoints; i ++) {
      float localDensity = densityAtPoint(densitySamplePoint);
      opticalDepth += localDensity * stepSize;
      densitySamplePoint += rayDir * stepSize;
    }
    return opticalDepth;
  }

  // TODO change this to max safe float;
  float maxFloatValue = 99999999999999.0;


  float sphereDistance(vec3 point, float radius) {
    return max(0.0, length(point) - radius);
  }
  // // returns vector (distanceToSphere, distanceThroughSphere) 
  // // if ray origin is inside sphere, distanceToSphere = 0;
  // // if ray misses sphere, distanceToSphere = maxValue; distanceThroughSphere = 0;
  // vec2 raySphere(vec3 sphereCenter, float sphereRadius, vec3 rayOrigin, vec3 rayDir) {
  //   vec3 offset = rayOrigin - sphereCenter;
  //   float a = dot(rayDir, rayDir); // set to dot(rayDir, rayDir) if rayDir might not be normalized
  //   float b = 2.0 * dot(offset, rayDir);
  //   float c = dot(offset, offset) - sphereRadius * sphereRadius;
  //   float d = b * b - 4.0 * a * c; // Discriminant from quadratic formula;

  //   // NMumber of intersections: 0 when d < 0; 1 when d = 0; 2 when d > 0
  //   if (d > 0.0) {
  //     float s = sqrt(d);
  //     float distanceToSphereNear = max(0.0, (-b - s) / (2.0 * a));
  //     float distanceToSphereFar = (-b + s) / (2.0 * a);

  //     // Ignore intersections that occur behind the ray
  //     if (distanceToSphereFar >= 0.0) {
  //       return vec2(distanceToSphereNear, distanceToSphereFar - distanceToSphereNear);
  //     }
  //   }

  //   // Ray did not intersect sphere
  //   return vec2(0.0, 0.0);
  // }

  /*
A ray-sphere intersect
This was previously used in the atmosphere as well, but it's only used for the planet intersect now, since the atmosphere has this
ray sphere intersect built in
*/

vec2 ray_sphere_intersect(
  vec3 start, // starting position of the ray
  vec3 dir, // the direction of the ray
  float radius // and the sphere radius
) {
  // ray-sphere intersection that assumes
  // the sphere is centered at the origin.
  // No intersection when result.x > result.y
  float a = dot(dir, dir);
  float b = 2.0 * dot(dir, start);
  float c = dot(start, start) - (radius * radius);
  float d = (b*b) - 4.0*a*c;
  if (d < 0.0) return vec2(1e5,-1e5);
  return vec2(
      (-b - sqrt(d))/(2.0*a),
      (-b + sqrt(d))/(2.0*a)
  );
}

  
	// Returns vector (dstToSphere, dstThroughSphere)
	// If ray origin is inside sphere, dstToSphere = 0
	// If ray misses sphere, dstToSphere = maxValue; dstThroughSphere = 0
	vec2 raySphere(vec3 sphereCentre, float sphereRadius, vec3 rayOrigin, vec3 rayDir) {
		vec3 offset = rayOrigin - sphereCentre;
		float a = 1.; // Set to dot(rayDir, rayDir) if rayDir might not be normalized
		float b = 2. * dot(offset, rayDir);
		float c = dot (offset, offset) - sphereRadius * sphereRadius;
		float d = b * b - 4. * a * c; // Discriminant from quadratic formula

		// Number of intersections: 0 when d < 0; 1 when d = 0; 2 when d > 0
		if (d > 0.) {
			float s = sqrt(d);
			float dstToSphereNear = max(0., (-b - s) / (2. * a));
			float dstToSphereFar = (-b + s) / (2. * a);

			// Ignore intersections that occur behind the ray
			if (dstToSphereFar >= 0.) {
				return vec2(dstToSphereNear, dstToSphereFar - dstToSphereNear);
			}
		}
		// Ray did not intersect sphere
		return vec2(3.402823466e+38, 0.);
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

  float calculateLight (vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 dirToSun = normalize(uDirToSun);
    vec3 inScatteringPoint = rayOrigin;
    float stepSize = rayLength / float(numInScatterPoints - 1);
    float inScatteredLight = 0.;
    for (int i = 0; i < numInScatterPoints; i++) {
      float sunRayLength = raySphere(uPlanetOrigin, uAtmosphereRadius, inScatteringPoint, dirToSun).y;
      float sunRayOpticalDepth = opticalDepth(inScatteringPoint, dirToSun, sunRayLength);
      
      float viewRayOpticalDepth = opticalDepth(inScatteringPoint, -rayDir, float(stepSize) * float(i));
      
      float transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth));//exp(-sunRayOpticalDepth) * exp(-viewRayOpticalDepth);
      float localDensity = densityAtPoint(inScatteringPoint);

      inScatteredLight += localDensity * transmittance * stepSize;
      inScatteringPoint += rayDir * stepSize;
    }
    return inScatteredLight;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    vec4 originalColor = texture2D(map, uv);

    vec2 screenPos    = squareFrame( uResolution );
    vec3 rayDirection = getRay( uWorldspaceCameraPosition, uViewVector, screenPos, 2.0 );

    float sceneDepth = depth * length(uViewVector);

    float atmosphereRadius = uAtmosphereRadius;
    vec3 rayOrigin = uWorldspaceCameraPosition;
    vec3 rayDir = rayDirection; //normalize(uViewVector);

    vec2 hitInfo = raySphere(uPlanetOrigin, atmosphereRadius, rayOrigin, rayDir);

    float distanceToAtmosphere = hitInfo.x;
    float distanceThroughAtmosphere = min(hitInfo.y, sceneDepth); // min(hitInfo.y, depth - distanceToAtmosphere);

    // if we're touching atmosphere
    if (distanceThroughAtmosphere > 0.) {
      float epsilon = 0.0001;
      vec3 pointInAtmosphere = rayOrigin + rayDir * (distanceToAtmosphere + epsilon);
      float light = calculateLight(pointInAtmosphere, rayDir, distanceThroughAtmosphere - epsilon * 2.);
      // vec4 testColor = vec4(light, 1.0);
      // outputColor = testColor;
      outputColor = inputColor * (1.0 - light) + light;
    } else if (hitInfo.y == 0.) {
      outputColor = inputColor;
    }

    // float whatever = sceneDepth; // / (atmosphereRadius * 2.0);
    // vec4 testColor = vec4(vec3(whatever), 1.0); //* vec4(rayDir.rgb * 0.5 + 0.5, 1.);
    // outputColor = testColor;
  }
`;

// This is like a helper, only used to expose some world position coordinates
export const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void mainSupport(const in vec2 uv) {
    vWorldPosition = position;
  }
`;
