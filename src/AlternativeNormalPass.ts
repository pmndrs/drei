/*
  Altered version of NormalPass.ts from postprocessing.js
  https://github.com/vanruesc/postprocessing/blob/master/src/passes/NormalPass.js
*/

import {
  Color,
  MeshNormalMaterial,
  NearestFilter,
  RGBFormat,
  WebGLRenderTarget,
  Scene,
  Camera,
  WebGLRenderer,
  Object3D,
} from 'three'

// @ts-ignore
import { Resizer, Pass, RenderPass } from 'postprocessing'

export class AlternativeNormalPass extends Pass {
  needsSwap: boolean
  renderPass: any
  resolution: any
  originalSize: any
  renderTarget?: WebGLRenderTarget
  resolutionScale?: number
  renderToScreen?: boolean

  constructor(
    scene: Scene,
    camera: Camera,
    {
      resolutionScale = 1.0,
      width = Resizer.AUTO_SIZE,
      height = Resizer.AUTO_SIZE,
      renderTarget,
    }: { resolutionScale?: number; width?: number; height?: number; renderTarget?: WebGLRenderTarget } = {}
  ) {
    super('AlternativeNormalPass')

    this.needsSwap = false

    this.renderPass = new RenderPass(scene, camera)

    const clearPass = this.renderPass.getClearPass()
    clearPass.overrideClearColor = new Color(0x7777ff)
    clearPass.overrideClearAlpha = 1.0

    this.renderTarget = renderTarget

    if (this.renderTarget === undefined) {
      this.renderTarget = new WebGLRenderTarget(1, 1, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBFormat,
        stencilBuffer: false,
      })

      this.renderTarget.texture.name = 'AlternativeNormalPass.Target'
    }

    this.resolution = new Resizer(this, width, height)
    this.resolution.scale = resolutionScale
  }

  getResolutionScale() {
    return this.resolutionScale
  }

  setResolutionScale(scale: any) {
    this.resolutionScale = scale
    this.setSize(this.originalSize.x, this.originalSize.y)
  }

  render(renderer: WebGLRenderer) {
    const renderTarget = this.renderToScreen ? null : this.renderTarget
    const scene: Scene = this.renderPass.scene

    // HACK for instancing: traverse the scene and replace the materials
    scene.traverse((n: Object3D & any) => {
      if (n.isMesh) {
        if (!n.normalMaterial) {
          n.normalMaterial = new MeshNormalMaterial()
        }

        n.materialOld = n.material
        n.material = n.normalMaterial
      }
    })

    this.renderPass.render(renderer, renderTarget, renderTarget)

    // Restore the old materials
    scene.traverse((n: Object3D & any) => {
      if (n.isMesh && n.materialOld) {
        n.material = n.materialOld
      }
    })
  }

  setSize(width: number, height: number) {
    const resolution = this.resolution
    resolution.base.set(width, height)

    width = resolution.width
    height = resolution.height

    if (this.renderTarget) {
      this.renderTarget.setSize(width, height)
    }
  }
}
