import * as THREE from 'three'
import * as React from 'react'

type Props = {
  stops: Array<number>
  colors: Array<string>
  attach?: string
  size?: number
} & JSX.IntrinsicElements['texture']

export function GradientTexture({ stops, colors, size = 2048, ...props }: Props) {
  const texture = React.useMemo(() => {
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')!
    canvas.width = 16
    canvas.height = size
    let gradient = context.createLinearGradient(0, 0, 0, size)
    let i = stops.length
    while (i--) {
      gradient.addColorStop(stops[i], colors[i])
    }
    context.fillStyle = gradient
    context.fillRect(0, 0, 16, size)
    let texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }, [stops])
  React.useEffect(() => () => void texture.dispose(), [texture])
  return <primitive object={texture} attach="map" {...props} />
}
