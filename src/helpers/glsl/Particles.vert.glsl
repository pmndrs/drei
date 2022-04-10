uniform float pixelRatio;
uniform float speed;
uniform float time;
attribute float size;  

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
  modelPosition.y += sin((time * speed) + modelPosition.x * 100.0) * 0.2;
  modelPosition.z += cos((time * speed) + modelPosition.x * 100.0) * 0.2;
  modelPosition.x += cos((time * speed) + modelPosition.x * 100.0) * 0.2;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPostion = projectionMatrix * viewPosition;

  gl_Position = projectionPostion;
  gl_PointSize = size * 25. * pixelRatio;
  gl_PointSize *= (1.0 / - viewPosition.z);
}