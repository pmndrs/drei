import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

type PointsProps = Omit<JSX.IntrinsicElements['points'], 'position'> & {
  // a buffer containing all points position
  position: Float32Array
  color?: Float32Array
  size?: Float32Array
  // The size of the points in the buffer
  stride?: 2 | 3
}

export const PointsBuffer = React.forwardRef<THREE.Points, PointsProps>(
  ({ children, position, color, size, stride = 3, ...props }, forwardedRef) => {
    const pointsRef = React.useRef<THREE.Points>(null!)

    useFrame(() => {
      const attr = pointsRef.current.geometry.attributes

      attr.position.needsUpdate = true

      if (color) {
        attr.color.needsUpdate = true
      }

      if (size) {
        attr.size.needsUpdate = true
      }
    })

    return (
      <points matrixAutoUpdate={false} ref={mergeRefs([forwardedRef, pointsRef])} {...props}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={position.length / stride}
            array={position}
            itemSize={stride}
            usage={THREE.DynamicDrawUsage}
          />
          {color && (
            <bufferAttribute
              attachObject={['attributes', 'color']}
              count={color.length / stride}
              array={color}
              itemSize={stride}
              usage={THREE.DynamicDrawUsage}
            />
          )}
          {size && (
            <bufferAttribute
              attachObject={['attributes', 'size']}
              count={size.length / stride}
              array={size}
              itemSize={stride}
              usage={THREE.DynamicDrawUsage}
            />
          )}
        </bufferGeometry>
        {children}
      </points>
    )
  }
)
