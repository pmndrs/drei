/*  Integration and compilation: @N8Programs
    Inspired by:
     https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shadowmap_pcss.html
     https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-17-efficient-soft-edged-shadows-using
     https://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
     https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadowmap_pcss.html [spidersharma03]
     https://spline.design/
   Concept:
     https://www.gamedev.net/tutorials/programming/graphics/contact-hardening-soft-shadows-made-fast-r4906/
   Vogel Disk Implementation:
     https://www.shadertoy.com/view/4l3yRM [ashalah]
   High-Frequency Noise Implementation:
     https://www.shadertoy.com/view/tt3fDH [spawner64]
*/

import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

export type SoftShadowsProps = {
  /** Size of the light source (the larger the softer the light), default: 25 */
  size?: number
  /** Number of samples (more samples less noise but more expensive), default: 10 */
  samples?: number
  /** Depth focus, use it to shift the focal point (where the shadow is the sharpest), default: 0 (the beginning) */
  focus?: number
}

const pcss = ({ focus = 0, size = 25, samples = 10 }: SoftShadowsProps, packedDepth: boolean) => {
  const depthSample = packedDepth
    ? 'unpackRGBAToDepth( texture2D( shadowMap, uv + offset ) )'
    : 'texture2D( shadowMap, uv + offset ).r'

  return `
#define PENUMBRA_FILTER_SIZE float(${size})
#define RGB_NOISE_FUNCTION(uv) (randRGB(uv))
vec3 randRGB(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}

vec3 lowPassRandRGB(vec2 uv) {
  // 3x3 convolution (average)
  // can be implemented as separable with an extra buffer for a total of 6 samples instead of 9
  vec3 result = vec3(0);
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, +1.0));
  result *= 0.111111111; // 1.0 / 9.0
  return result;
}
vec3 highPassRandRGB(vec2 uv) {
  // by subtracting the low-pass signal from the original signal, we're being left with the high-pass signal
  // hp(x) = x - lp(x)
  return RGB_NOISE_FUNCTION(uv) - lowPassRandRGB(uv) + 0.5;
}


vec2 pcssVogelDiskSample(int sampleIndex, int sampleCount, float angle) {
  const float goldenAngle = 2.399963f; // radians
  float r = sqrt(float(sampleIndex) + 0.5f) / sqrt(float(sampleCount));
  float theta = float(sampleIndex) * goldenAngle + angle;
  float sine = sin(theta);
  float cosine = cos(theta);
  return vec2(cosine, sine) * r;
}
float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
  return (zReceiver - zBlocker) / zBlocker;
}
float findBlocker(sampler2D shadowMap, vec2 uv, float compare, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float blockerDepthSum = float(${focus});
  float blockers = 0.0;

  int j = 0;
  vec2 offset = vec2(0.);
  float depth = 0.;

  #pragma unroll_loop_start
  for(int i = 0; i < ${samples}; i ++) {
    offset = (pcssVogelDiskSample(j, ${samples}, angle) * texelSize) * 2.0 * PENUMBRA_FILTER_SIZE;
    depth = ${depthSample};
    if (depth < compare) {
      blockerDepthSum += depth;
      blockers++;
    }
    j++;
  }
  #pragma unroll_loop_end

  if (blockers > 0.0) {
    return blockerDepthSum / blockers;
  }
  return -1.0;
}

        
float vogelFilter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float shadow = 0.0f;
  int j = 0;
  vec2 vogelSample = vec2(0.0);
  vec2 offset = vec2(0.0);
  #pragma unroll_loop_start
  for (int i = 0; i < ${samples}; i++) {
    vogelSample = pcssVogelDiskSample(j, ${samples}, angle) * texelSize;
    offset = vogelSample * (1.0 + filterRadius * float(${size}));
    shadow += step( zReceiver, ${depthSample} );
    j++;
  }
  #pragma unroll_loop_end
  return shadow * 1.0 / ${samples}.0;
}

float PCSS (sampler2D shadowMap, vec4 coords) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code
  float angle = highPassRandRGB(gl_FragCoord.xy).r * PI2;
  float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver, angle);
  if (avgBlockerDepth == -1.0) {
    return 1.0;
  }
  float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
  return vogelFilter(shadowMap, uv, zReceiver, 1.25 * penumbraRatio, angle);
}`
}

function reset(gl, scene, camera) {
  scene.traverse((object) => {
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        gl.properties.remove(material)
        material.dispose?.()
        material.needsUpdate = true
      })
    }
  })
  gl.info.programs.length = 0
  gl.compile(scene, camera)
}

export function SoftShadows({ focus = 0, samples = 10, size = 25 }: SoftShadowsProps) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  React.useEffect(() => {
    const original = THREE.ShaderChunk.shadowmap_pars_fragment
    // PCF shadows use a comparison sampler in newer three.js versions.
    // That sampler cannot expose the raw depth needed for blocker search.
    const packedDepth = !original.includes('sampler2DShadow')
    // In newer three.js the final sampler2D overload is the Basic shadow path.
    const getShadowStart = original.lastIndexOf('float getShadow( sampler2D shadowMap')
    const frustumEnd = original.indexOf('if ( frustumTest ) {', getShadowStart) + 'if ( frustumTest ) {'.length

    if (getShadowStart < 0 || frustumEnd < 'if ( frustumTest ) {'.length) {
      console.warn('[SoftShadows] Could not find injection point in shadow shader')
      return
    }

    const originalType = gl.shadowMap.type
    // Newer three.js uses sampler2DShadow for PCF. PCSS needs the raw depth,
    // which is available through the Basic shadow map's sampler2D instead.
    if (!packedDepth) gl.shadowMap.type = THREE.BasicShadowMap

    const hasIntensity = original.slice(getShadowStart, frustumEnd).includes('shadowIntensity')
    const pcssReturn = hasIntensity
      ? 'return mix( 1.0, PCSS( shadowMap, shadowCoord ), shadowIntensity );'
      : 'return PCSS( shadowMap, shadowCoord );'
    const shader = (original.slice(0, frustumEnd) + '\n' + pcssReturn + original.slice(frustumEnd)).replace(
      '#ifdef USE_SHADOWMAP',
      '#ifdef USE_SHADOWMAP\n' + pcss({ size, samples, focus }, packedDepth)
    )
    THREE.ShaderChunk.shadowmap_pars_fragment = shader
    reset(gl, scene, camera)
    return () => {
      THREE.ShaderChunk.shadowmap_pars_fragment = original
      gl.shadowMap.type = originalType
      reset(gl, scene, camera)
    }
  }, [focus, size, samples])
  return null
}
