/** Original material by @ore_ukonpower and http://next.junni.co.jp
 *  https://github.com/junni-inc/next.junni.co.jp/blob/master/src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/shaders/transparent.fs
 */

import * as THREE from 'three'
import * as React from 'react'
import { extend, useThree, useFrame, ReactThreeFiber } from '@react-three/fiber'
import { useFBO } from './useFBO'

type MeshTransmissionMaterialType = Omit<JSX.IntrinsicElements['meshPhysicalMaterial'], 'args'> & {
  /** Refraction shift, default: 0 */
  refraction?: number
  /** RGB color shift, default: 0.3 */
  rgbShift?: number
  /** Noise, default: 0.03 */
  noise?: number
  /** Color saturation, default: 1 */
  saturation?: number
  /** Color contrast, default: 1 */
  contrast?: number
  resolution?: ReactThreeFiber.Vector2
  buffer?: THREE.Texture
  args?: [{ samples: number }]
}

type MeshTransmissionMaterialProps = Omit<MeshTransmissionMaterialType, 'resolution' | 'buffer' | 'args'> & {
  /** Resolution of the local buffer, default: 1024 */
  resolution?: number
  /** Refraction samples, default: 10 */
  samples?: number
  /** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
  background?: THREE.Texture
}

interface Uniform<T> {
  value: T
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshTransmissionMaterial: MeshTransmissionMaterialType
    }
  }
}

class MeshTransmissionMaterialImpl extends THREE.MeshPhysicalMaterial {
  uniforms: {
    refraction: Uniform<number>
    buffer: Uniform<THREE.Texture | null>
    rgbShift: Uniform<number>
    noise: Uniform<number>
    saturation: Uniform<number>
    contrast: Uniform<number>
    resolution: Uniform<THREE.Vector2>
  }

  constructor({ samples = 10, ...args } = {}) {
    super(args)

    this.uniforms = {
      refraction: { value: 0 },
      rgbShift: { value: 0.3 },
      noise: { value: 0.03 },
      saturation: { value: 1.0 },
      contrast: { value: 1.0 },
      buffer: { value: null },
      resolution: { value: new THREE.Vector2() },
    }

    this.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        ...this.uniforms,
      }

      shader.fragmentShader =
        `uniform float rgbShift;
      uniform vec2 resolution;
      uniform float refraction;
      uniform float noise;
      uniform float saturation;
      uniform float contrast;
      uniform sampler2D buffer;
      
      float random(vec2 p) {
        return fract(sin(dot(p.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }
    
      vec3 sat(vec3 rgb, float adjustment) {
        const vec3 W = vec3(0.2125, 0.7154, 0.0721);
        vec3 intensity = vec3(dot(rgb, W));
        return mix(intensity, rgb, adjustment);
      }
      ` + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 refractNormal = vNormal.xy * (1.0 - vNormal.xy);
        vec3 refractCol = vec3(0.0);
        float slide;
        #pragma unroll_loop_start
        for (int i = 0; i < ${samples}; i ++) {
          slide = float(UNROLLED_LOOP_INDEX) / float(${samples}) * 0.1 + random(uv) * noise;              
          refractCol.r += texture2D(buffer, uv - refractNormal * (refraction + slide * 1.0) * rgbShift).r;
          refractCol.g += texture2D(buffer, uv - refractNormal * (refraction + slide * 2.0) * rgbShift).g;
          refractCol.b += texture2D(buffer, uv - refractNormal * (refraction + slide * 3.0) * rgbShift).b;
          refractCol = sat(refractCol, saturation);
        }
        #pragma unroll_loop_end
        outgoingLight *= refractCol / float(${samples}) * contrast;
        #include <output_fragment>`
      )
    }

    Object.keys(this.uniforms).forEach((name) =>
      Object.defineProperty(this, name, {
        get: () => this.uniforms[name].value,
        set: (v) => (this.uniforms[name].value = v),
      })
    )
  }
}

export const MeshTransmissionMaterial = React.forwardRef(
  ({ samples = 10, resolution = 1024, background, ...props }: MeshTransmissionMaterialProps, fref) => {
    extend({ MeshTransmissionMaterial: MeshTransmissionMaterialImpl })

    const ref = React.useRef<JSX.IntrinsicElements['meshTransmissionMaterial']>(null!)
    const { size, viewport } = useThree()
    const fbo = useFBO(resolution)
    const config = React.useMemo(() => ({ samples }), [samples])

    let oldBg
    let oldVis
    let parent
    useFrame((state) => {
      parent = (ref.current as any).__r3f.parent as THREE.Object3D
      if (parent) {
        // Hide the outer groups contents
        oldVis = parent.visible
        parent.visible = false
        // Set render target to the local buffer
        state.gl.setRenderTarget(fbo)
        // Save the current background and set the HDR as the new BG
        // This is what creates the reflections
        oldBg = state.scene.background
        if (background) state.scene.background = background
        // Render into the buffer
        state.gl.render(state.scene, state.camera)
        // Set old state back
        state.scene.background = oldBg
        state.gl.setRenderTarget(null)
        parent.visible = oldVis
      }
    })

    // Forward ref
    React.useImperativeHandle(fref, () => ref.current, [])

    return (
      <meshTransmissionMaterial
        args={[config]}
        ref={ref}
        buffer={fbo.texture}
        resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
        {...props}
      />
    )
  }
)
