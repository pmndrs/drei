import * as React from 'react'
import { useTexture } from '../../../core/Loaders/useTexture/useTexture'
import { RepeatWrapping, Texture, Vector2 } from '#three'
import { suspend } from 'suspend-react'

const NORMAL_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/7a3104997e1576f83472829815b00880d88b32fb'
const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/normals/normals.json'

type Settings = {
  repeat?: number[]
  anisotropy?: number
  offset?: number[]
}

export function useNormalTexture(
  id = 0,
  settings: Settings = {},
  onLoad?: (texture: Texture | Texture[]) => void
): [Texture, string, number] {
  const { repeat = [1, 1], anisotropy = 1, offset = [0, 0] } = settings

  const normalsList = suspend(() => fetch(LIST_URL).then((res) => res.json()), ['normalsList']) as Record<
    string,
    string
  >
  const numTot = React.useMemo(() => Object.keys(normalsList).length, [])
  const DEFAULT_NORMAL = normalsList[0]

  const imageName = normalsList[id] || DEFAULT_NORMAL
  const url = `${NORMAL_ROOT}/normals/${imageName}`

  const normalTexture = useTexture(url, onLoad) as Texture

  React.useLayoutEffect(() => {
    if (!normalTexture) return
    normalTexture.wrapS = normalTexture.wrapT = RepeatWrapping
    normalTexture.repeat = new Vector2(repeat[0], repeat[1])
    normalTexture.offset = new Vector2(offset[0], offset[1])
    normalTexture.anisotropy = anisotropy
  }, [normalTexture, anisotropy, repeat, offset])

  return [normalTexture, url, numTot]
}

//

/**
 * Loads a normal texture from the normals repository.
 *
 * @example Basic usage
 * ```jsx
 * <NormalTexture id={3} repeat={[4, 4]}>
 *   {(texture) => <meshStandardMaterial normalMap={texture} />}
 * </NormalTexture>
 * ```
 */
export const NormalTexture = ({
  children,
  id,
  onLoad,
  ...settings
}: {
  children?: (texture: ReturnType<typeof useNormalTexture>) => React.ReactNode
  id?: Parameters<typeof useNormalTexture>[0]
  onLoad?: Parameters<typeof useNormalTexture>[2]
} & Settings) => {
  const ret = useNormalTexture(id, settings, onLoad)

  return <>{children?.(ret)}</>
}
