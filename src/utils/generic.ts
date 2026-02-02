export function roundToPixelRatio(value: number) {
  const ratio = window.devicePixelRatio || 1
  return Math.round(value * ratio) / ratio
}
