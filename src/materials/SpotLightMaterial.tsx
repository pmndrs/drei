import { ShaderMaterial, Vector3, Color, Vector2 } from 'three'

export class SpotLightMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        depth: { value: null },
        opacity: { value: 1 },
        attenuation: { value: 2.5 },
        anglePower: { value: 12 },
        spotPosition: { value: new Vector3(0, 0, 0) },
        lightColor: { value: new Color('white') },
        cameraNear: { value: 0 },
        cameraFar: { value: 1 },
        resolution: { value: new Vector2(0, 0) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vViewZ;
      varying float vIntensity;
      uniform vec3 spotPosition;
      uniform float attenuation;      

      void main() {
        // compute intensity
        vNormal = normalize( normalMatrix * normal );
        vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        vec4 viewPosition = viewMatrix * worldPosition;
        vViewZ = viewPosition.z;
        float intensity	= distance(worldPosition.xyz, spotPosition) / attenuation;
        intensity	= 1.0 - clamp(intensity, 0.0, 1.0);
        vIntensity = intensity;        
        // set gl_Position
        gl_Position	= projectionMatrix * viewPosition;

      }`,
      fragmentShader: /* glsl */ `
      #include <packing>

      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      uniform vec3 lightColor;
      uniform vec3 spotPosition;
      uniform float attenuation;
      uniform float anglePower;
      uniform sampler2D depth;
      uniform vec2 resolution;
      uniform float cameraNear;
      uniform float cameraFar;
      varying float vViewZ;
      varying float vIntensity;
      uniform float opacity;

      float readDepth( sampler2D depthSampler, vec2 coord ) {
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        return viewZ;
      }

      void main() {
        float d = 1.0;
        bool isSoft = resolution[0] > 0.0 && resolution[1] > 0.0;
        if (isSoft) {
          vec2 sUv = gl_FragCoord.xy / resolution;
          d = readDepth(depth, sUv);
        }
        float intensity = vIntensity;
        vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));
        float angleIntensity	= pow( dot(normal, vec3(0.0, 0.0, 1.0)), anglePower );
        intensity	*= angleIntensity;
        // fades when z is close to sampled depth, meaning the cone is intersecting existing geometry
        if (isSoft) {
          intensity	*= smoothstep(0., 1., vViewZ - d);
        }
        gl_FragColor = vec4(lightColor, intensity * opacity);

        #include <tonemapping_fragment>
	      #include <encodings_fragment>
      }`,
    })
  }
}
