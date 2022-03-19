import * as React from 'react'
import pick from 'lodash.pick'

type Props = Omit<JSX.IntrinsicElements['group'], 'children'> & {
  object: THREE.Object3D
  children?: React.ReactNode | ((object: THREE.Object3D) => React.ReactNode)
  deep?: boolean
  keys?: string[]
  castShadow?: boolean
  receiveShadow?: boolean
}

export function Clone({
  object,
  deep = false,
  castShadow,
  receiveShadow,
  children,
  keys = [
    'near',
    'far',
    'color',
    'distance',
    'decay',
    'penumbra',
    'angle',
    'intensity',
    'skeleton',
    'visible',
    'castShadow',
    'receiveShadow',
    'morphTargetDictionary',
    'morphTargetInfluences',
    'name',
    'geometry',
    'material',
    'position',
    'rotation',
    'scale',
    'up',
    'userData',
  ],
  ...props
}: Props) {
  const spread = pick(object, keys)
  return (
    <group {...props}>
      <group {...spread}>
        {object?.children.map((child) => {
          let spread = pick(child, keys)
          if (deep) {
            if (spread.geometry) spread.geometry = spread.geometry.clone()
            if (spread.material) spread.material = spread.material.clone()
          }
          let Element: string | typeof Clone = child.type[0].toLowerCase() + child.type.slice(1)
          if (Element === 'group' || Element === 'object3D') {
            Element = Clone
            spread = { object: child, castShadow, receiveShadow, deep, keys }
          } else if (Element === 'mesh') {
            if (castShadow) spread.castShadow = true
            if (receiveShadow) spread.receiveShadow = true
          }
          return (
            <Element key={child.uuid} {...spread}>
              {typeof children === 'function' ? children(child) : children}
            </Element>
          )
        })}
      </group>
    </group>
  )
}
