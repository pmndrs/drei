varying vec2 vUv;

uniform sampler2D uShadowMap;
uniform float uTime;

void main() {
    vec3 color = texture2D(uShadowMap, vUv).xyz;
    gl_FragColor = vec4(color, 1.);
}
