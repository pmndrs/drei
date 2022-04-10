#define ENVMAP_TYPE_CUBE_UV

varying vec3 vWorldPosition;

uniform float radius;
uniform float height;

#ifdef ENVMAP_TYPE_CUBE
  uniform samplerCube cubemap;
#else
  uniform sampler2D cubemap;
#endif
  
// From: https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
float diskIntersect( in vec3 ro, in vec3 rd, vec3 c, vec3 n, float r ) {
    vec3  o = ro - c;
    float t = -dot(n, o)/dot(rd,n);
    vec3  q = o + rd * t;
    return (dot(q, q) < r * r) ? t : 1e6;
}

// From: https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
float sphereIntersect( in vec3 ro, in vec3 rd, in vec3 ce, float ra ) {
    vec3 oc = ro - ce;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - ra*ra;
    float h = b * b - c;
    if(h < 0.0) -1.0;
    h = sqrt( h );
    return -b + h;
}
  
vec3 project() {
  vec3 p = normalize(vWorldPosition);
  vec3 camPos = cameraPosition;
  camPos.y -= height;

  float intersection = sphereIntersect(camPos, p, vec3(0.), radius);
  if(intersection > 0.) {
    vec3 h = vec3(0.0,-height,0.0);
    float intersection2 = diskIntersect(camPos, p, h, vec3(0.0,-1.0,0.0), radius);
    p = (camPos + min(intersection, intersection2) * p) / radius;
  }
  else {
    p = vec3(0.0,1.0,0.0);
  }
  return p;
}

#include <common>
#include <cube_uv_reflection_fragment>

void main(){
  vec3 projectedWorldPosition = project();
  
  #ifdef ENVMAP_TYPE_CUBE
    vec3 outcolor = textureCube(cubemap, projectedWorldPosition).rgb;
  #else
    vec3 direction = normalize(projectedWorldPosition);
    vec2 uv = equirectUv(direction);
    vec3 outcolor = texture2D(cubemap, uv).rgb;
  #endif

  gl_FragColor = vec4(outcolor, 1.0);

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}