export const fragmentShader = /* glsl */ `
  #ifdef FRAMEBUFFER_PRECISION_HIGH
    uniform mediump sampler2D map;
  #else
    uniform lowp sampler2D map;
  #endif
  
  
  uniform vec3 uViewVector;
  uniform vec3 uWorldspaceCameraPosition;
  // blah
  uniform vec2 uResolution;
  uniform float uFov;
  // planet info
  uniform float uAtmosphereRadius;
  uniform vec3 uPlanetOrigin;
  uniform float uPlanetRadius;
  uniform vec3 uSunPosition;

  // atmosphere info
  float densityFalloff = 15.0;
  int numOpticalDepthPoints = 20;
  int numInScatterPoints = 20;
  


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


	// // Returns vector (dstToSphere, dstThroughSphere)
	// // If ray origin is inside sphere, dstToSphere = 0
	// // If ray misses sphere, dstToSphere = maxValue; dstThroughSphere = 0
	// vec2 raySphere(vec3 sphereCentre, float sphereRadius, vec3 rayOrigin, vec3 rayDir) {
	// 	vec3 offset = rayOrigin - sphereCentre;
	// 	float a = 1.; // Set to dot(rayDir, rayDir) if rayDir might not be normalized
	// 	float b = 2. * dot(offset, rayDir);
	// 	float c = dot (offset, offset) - sphereRadius * sphereRadius;
	// 	float d = b * b - 4. * a * c; // Discriminant from quadratic formula

	// 	// Number of intersections: 0 when d < 0; 1 when d = 0; 2 when d > 0
	// 	if (d > 0.) {
	// 		float s = sqrt(d);
	// 		float dstToSphereNear = max(0., (-b - s) / (2. * a));
	// 		float dstToSphereFar = (-b + s) / (2. * a);

	// 		// Ignore intersections that occur behind the ray
	// 		if (dstToSphereFar >= 0.) {
	// 			return vec2(dstToSphereNear, dstToSphereFar - dstToSphereNear);
	// 		}
	// 	}
	// 	// Ray did not intersect sphere
	// 	return vec2(3.402823466e+38, 0.);
	// }
  


  float calculateLight (vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 dirToSun = normalize(uSunPosition - rayOrigin);
    vec3 inScatteringPoint = rayOrigin;
    float stepSize = rayLength / float(numInScatterPoints - 1);
    float inScatteredLight = 0.;

    // float sunRayOpticalDepth = opticalDepth(inScatteringPoint, dirToSun, sunRayLength);

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
      // vec4 testColor = vec4(vec3(light), 1.0);
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
