import * as React from 'react'
import {
  Plane,
  Vector3,
  Vector4,
  Matrix4,
  PerspectiveCamera,
  RGBFormat,
  MeshStandardMaterial,
  NoBlending,
  ShaderMaterial,
  Uniform,
  Vector2,
  Mesh,
  BufferGeometry,
  BufferAttribute,
  Camera,
  LinearFilter,
  Scene,
  WebGLRenderTarget,
} from 'three'
import { extend, useFrame, useThree } from 'react-three-fiber'

class ConvolutionMaterial extends ShaderMaterial {
  constructor(texelSize = new Vector2()) {
    super({
      uniforms: {
        inputBuffer: new Uniform(null),
        texelSize: new Uniform(new Vector2()),
        halfTexelSize: new Uniform(new Vector2()),
        kernel: new Uniform(0.0),
        scale: new Uniform(1.0),
      },
      fragmentShader: `#include <common>
      #include <dithering_pars_fragment>      
      uniform sampler2D inputBuffer;
      varying vec2 vUv0;
      varying vec2 vUv1;
      varying vec2 vUv2;
      varying vec2 vUv3;
      void main() {
        vec4 sum = texture2D(inputBuffer, vUv0);
        sum += texture2D(inputBuffer, vUv1);
        sum += texture2D(inputBuffer, vUv2);
        sum += texture2D(inputBuffer, vUv3);
        gl_FragColor = sum * 0.25;
        #include <dithering_fragment>
      }`,
      vertexShader: `uniform vec2 texelSize;
      uniform vec2 halfTexelSize;
      uniform float kernel;
      uniform float scale;
      varying vec2 vUv0;
      varying vec2 vUv1;
      varying vec2 vUv2;
      varying vec2 vUv3;
      void main() {
        vec2 uv = position.xy * 0.5 + 0.5;
        vec2 dUv = (texelSize * vec2(kernel) + halfTexelSize) * scale;
        vUv0 = vec2(uv.x - dUv.x, uv.y + dUv.y);
        vUv1 = vec2(uv.x + dUv.x, uv.y + dUv.y);
        vUv2 = vec2(uv.x + dUv.x, uv.y - dUv.y);
        vUv3 = vec2(uv.x - dUv.x, uv.y - dUv.y);
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }`,
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
    })

    this.toneMapped = false
    this.setTexelSize(texelSize.x, texelSize.y)
    this.kernel = new Float32Array([0.0, 1.0, 2.0, 2.0, 3.0])
  }

  setTexelSize(x, y) {
    this.uniforms.texelSize.value.set(x, y)
    this.uniforms.halfTexelSize.value.set(x, y).multiplyScalar(0.5)
  }
}

class BlurPass {
  constructor({ gl, resolution, width = 500, height = 500 } = {}) {
    this.renderTargetA = new WebGLRenderTarget(resolution, resolution, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
      encoding: gl.outputEncoding,
    })
    this.renderTargetB = this.renderTargetA.clone()
    this.convolutionMaterial = new ConvolutionMaterial()
    this.convolutionMaterial.setTexelSize(1.0 / width, 1.0 / height)
    this.scene = new Scene()
    this.camera = new Camera()
    const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2])
    const geometry = new BufferGeometry()
    geometry.addAttribute('position', new BufferAttribute(vertices, 3))
    geometry.addAttribute('uv', new BufferAttribute(uvs, 2))
    this.screen = new Mesh(geometry, this.convolutionMaterial)
    this.screen.frustumCulled = false
    this.scene.add(this.screen)
  }

  render(renderer, inputBuffer, outputBuffer) {
    const scene = this.scene
    const camera = this.camera
    const renderTargetA = this.renderTargetA
    const renderTargetB = this.renderTargetB
    let material = this.convolutionMaterial
    let uniforms = material.uniforms
    const kernel = material.kernel
    let lastRT = inputBuffer
    let destRT
    let i, l
    // Apply the multi-pass blur.
    for (i = 0, l = kernel.length - 1; i < l; ++i) {
      // Alternate between targets.
      destRT = (i & 1) === 0 ? renderTargetA : renderTargetB
      uniforms.kernel.value = kernel[i]
      uniforms.inputBuffer.value = lastRT.texture
      renderer.setRenderTarget(destRT)
      renderer.render(scene, camera)
      lastRT = destRT
    }
    uniforms.kernel.value = kernel[i]
    uniforms.inputBuffer.value = lastRT.texture
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer)
    renderer.render(scene, camera)
  }
}

class MeshReflectorMaterial extends MeshStandardMaterial {
  _tDiffuse
  _textureMatrix
  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this._tDiffuse = { value: null }
    this._textureMatrix = { value: null }
    this._mirror = { value: 0 }
  }
  onBeforeCompile(shader) {
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;     
      ${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`
    )
    shader.fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform float mirror;
        varying vec4 my_vUv;
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
        vec4 base = texture2DProj(tDiffuse, my_vUv);
        vec4 tColor = base;
        diffuseColor.rgb = diffuseColor.rgb * (1.0 - mirror) + tColor.rgb;        
        diffuseColor = sRGBToLinear(diffuseColor);`
    )
  }
  get tDiffuse() {
    return this._tDiffuse.value
  }
  set tDiffuse(v) {
    this._tDiffuse.value = v
  }
  get textureMatrix() {
    return this._textureMatrix.value
  }
  set textureMatrix(v) {
    this._textureMatrix.value = v
  }
  get mirror() {
    return !!this._mirror.value
  }
  set mirror(v) {
    this._mirror.value = v ? 1 : 0
  }
}

extend({ MeshReflectorMaterial })

export function Reflector({ resolution = 512, blur = [0, 0], args = [12, 12], mirror, children, ...props }) {
  blur = Array.isArray(blur) ? blur : [blur, blur]
  const hasBlur = blur[0] + blur[1] > 0
  const meshRef = React.useRef()
  const [reflectorPlane] = React.useState(() => new Plane())
  const [normal] = React.useState(() => new Vector3())
  const [reflectorWorldPosition] = React.useState(() => new Vector3())
  const [cameraWorldPosition] = React.useState(() => new Vector3())
  const [rotationMatrix] = React.useState(() => new Matrix4())
  const [lookAtPosition] = React.useState(() => new Vector3(0, 0, -1))
  const [clipPlane] = React.useState(() => new Vector4())
  const [view] = React.useState(() => new Vector3())
  const [target] = React.useState(() => new Vector3())
  const [q] = React.useState(() => new Vector4())
  const [textureMatrix] = React.useState(() => new Matrix4())
  const [virtualCamera] = React.useState(() => new PerspectiveCamera())
  const { gl, scene, camera } = useThree()

  const beforeRender = React.useCallback(() => {
    reflectorWorldPosition.setFromMatrixPosition(meshRef.current.matrixWorld)
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)
    rotationMatrix.extractRotation(meshRef.current.matrixWorld)
    normal.set(0, 0, 1)
    normal.applyMatrix4(rotationMatrix)
    view.subVectors(reflectorWorldPosition, cameraWorldPosition)
    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return
    view.reflect(normal).negate()
    view.add(reflectorWorldPosition)
    rotationMatrix.extractRotation(camera.matrixWorld)
    lookAtPosition.set(0, 0, -1)
    lookAtPosition.applyMatrix4(rotationMatrix)
    lookAtPosition.add(cameraWorldPosition)
    target.subVectors(reflectorWorldPosition, lookAtPosition)
    target.reflect(normal).negate()
    target.add(reflectorWorldPosition)
    virtualCamera.position.copy(view)
    virtualCamera.up.set(0, 1, 0)
    virtualCamera.up.applyMatrix4(rotationMatrix)
    virtualCamera.up.reflect(normal)
    virtualCamera.lookAt(target)
    virtualCamera.far = camera.far // Used in WebGLBackground
    virtualCamera.updateMatrixWorld()
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix)
    // Update the texture matrix
    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
    textureMatrix.multiply(virtualCamera.projectionMatrix)
    textureMatrix.multiply(virtualCamera.matrixWorldInverse)
    textureMatrix.multiply(meshRef.current.matrixWorld)
    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition)
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse)
    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant)
    const projectionMatrix = virtualCamera.projectionMatrix
    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    q.z = -1.0
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]
    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))
    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x
    projectionMatrix.elements[6] = clipPlane.y
    projectionMatrix.elements[10] = clipPlane.z + 1.0
    projectionMatrix.elements[14] = clipPlane.w
  }, [])

  const [renderTarget, fbo1, fbo2, blurpass, reflectorProps] = React.useMemo(() => {
    const parameters = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBFormat,
      encoding: gl.outputEncoding,
    }
    const fbo1 = new WebGLRenderTarget(resolution, resolution, parameters)
    const fbo2 = new WebGLRenderTarget(resolution, resolution, parameters)
    const blurpass = new BlurPass({ gl, resolution, width: blur[0], height: blur[1] })
    const reflectorProps = { mirror, textureMatrix, tDiffuse: hasBlur ? fbo2.texture : fbo1.texture }
    return [renderTarget, fbo1, fbo2, blurpass, reflectorProps]
  }, [gl, resolution, mirror, blur[0], blur[1]])

  useFrame(() => {
    meshRef.current.visible = false
    beforeRender()
    gl.setRenderTarget(fbo1)
    gl.render(scene, virtualCamera)
    if (hasBlur) blurpass.render(gl, fbo1, fbo2)
    meshRef.current.visible = true
    gl.setRenderTarget(null)
  })

  return (
    <mesh ref={meshRef} {...props}>
      <planeBufferGeometry args={args} />
      {children ? children('meshReflectorMaterial', reflectorProps) : <meshReflectorMaterial {...reflectorProps} />}
    </mesh>
  )
}
