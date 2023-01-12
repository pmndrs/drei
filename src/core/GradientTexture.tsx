import * as THREE from 'three'
import * as React from 'react'
import { useThree } from '@react-three/fiber'

type Props = {
  stops: Array<number>
  colors: Array<string>
  attach?: string
  size?: number
} & JSX.IntrinsicElements['texture']

export function GradientTexture({ stops, colors, size = 1024, ...props }: Props) {
  const gl = useThree((state) => state.gl)
  const texture = React.useMemo(() => {
    const canvas = new OffscreenCanvas(16, size)
    const context = canvas.getContext('2d')!
    const gradient = context.createLinearGradient(0, 0, 0, size)
    let i = stops.length
    while (i--) {
      gradient.addColorStop(stops[i], colors[i])
    }
    context.fillStyle = gradient
    context.fillRect(0, 0, 16, size)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [stops])
  React.useEffect(() => () => void texture.dispose(), [texture])
  return <primitive object={texture} attach="map" encoding={gl.outputEncoding} {...props} />
}
