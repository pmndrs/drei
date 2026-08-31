export function roundToPixelRatio(value: number) {
  const ratio = window.devicePixelRatio || 1
  return Math.round(value * ratio) / ratio
}

/**
 * Max texture anisotropy, across both renderers.
 *
 * WebGPU's Renderer exposes getMaxAnisotropy() directly; WebGLRenderer keeps it
 * on .capabilities. R3FRenderer is the union of the two, so neither shape is
 * reachable without narrowing.
 */
export function getMaxAnisotropy(renderer: unknown): number {
  const r = renderer as {
    getMaxAnisotropy?: () => number
    capabilities?: { getMaxAnisotropy?: () => number }
  }
  return r?.getMaxAnisotropy?.() ?? r?.capabilities?.getMaxAnisotropy?.() ?? 1
}
