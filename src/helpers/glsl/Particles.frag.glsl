uniform vec3 color; 
uniform float opacity; 
uniform float size; 

void main() {
    vec2 uv = 0.5 - gl_PointCoord.xy;
    float ll = length(uv);

    float distance  = distance(vec2(0.), uv);
    float intensity = 1.0 - min(distance, 0.2) / 0.2;

    if(intensity < 0.1) discard;
    
    gl_FragColor = vec4(color, intensity * opacity);
}