import * as React from 'react'

type Props = {
  stops: Array<number>
  colors: Array<string>
  attach?: string
  size?: number
} & JSX.IntrinsicElements['texture']

export function GradientTexture({ stops, colors, size = 1024, ...props }: Props) {
  const canvas: HTMLCanvasElement = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 16
    canvas.height = size
    const gradient = context.createLinearGradient(0, 0, 0, size)
    let i = stops.length
    while (i--) {
      gradient.addColorStop(stops[i], colors[i])
    }
    context.fillStyle = gradient
    context.fillRect(0, 0, 16, size)
    return canvas
  }, [stops])
  // @ts-ignore ????
  return <canvasTexture args={[canvas]} attach="map" {...props} />
}
