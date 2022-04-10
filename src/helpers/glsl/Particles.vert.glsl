uniform float time;
uniform float radius;
uniform float size;

void main() {
  vec3 n = curlNoise(position + time * 0.005);
  vec3 p = n * radius;

  gl_PointSize = size * 10.;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}