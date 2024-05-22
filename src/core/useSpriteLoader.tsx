import { Texture, TextureLoader } from 'three'
import { Size, useLoader, useThree } from '@react-three/fiber'
import { useState } from 'react'
import * as React from 'react'
import * as THREE from 'three'

// utils
export const getFirstItem = (param: any): any => {
  if (Array.isArray(param)) {
    return param[0]
  } else if (typeof param === 'object' && param !== null) {
    const keys = Object.keys(param)

    return param[keys[0]][0]
  } else {
    return { w: 0, h: 0 }
  }
}

export const calculateAspectRatio = (width: number, height: number, factor: number, size: Size): THREE.Vector3 => {
  const aspect = size.width / size.height
  const adaptedHeight = height * (aspect > width / height ? size.width / width : size.height / height)
  const adaptedWidth = width * (aspect > width / height ? size.width / width : size.height / height)
  const scaleX = adaptedWidth * factor
  const scaleY = adaptedHeight * factor
  const currentMaxScale = 1
  // Calculate the maximum scale based on the aspect ratio and max scale limit
  let finalMaxScaleW = Math.min(currentMaxScale, scaleX)
  let finalMaxScaleH = Math.min(currentMaxScale, scaleY)

  // Ensure that scaleX and scaleY do not exceed the max scale while maintaining aspect ratio
  if (scaleX > currentMaxScale) {
    finalMaxScaleW = currentMaxScale
    finalMaxScaleH = (scaleY / scaleX) * currentMaxScale
  }

  return new THREE.Vector3(finalMaxScaleW, finalMaxScaleH, 1)
}

export function useSpriteLoader<Url extends string>(
  input?: Url | null,
  json?: string | null,
  animationNames?: string[] | null,
  numberOfFrames?: number | null,
  onLoad?: (texture: Texture, textureData?: any) => void
): any {
  const size = useThree((state) => state.size)
  const spriteDataRef = React.useRef<any>(null)
  const totalFrames = React.useRef<number>(0)
  const aspectFactor = 0.1
  const [spriteData, setSpriteData] = useState<Record<string, any> | null>(null)
  const [spriteTexture, setSpriteTexture] = React.useState<THREE.Texture>(new THREE.Texture())
  const textureLoader = new THREE.TextureLoader()
  const [spriteObj, setSpriteObj] = useState<Record<string, any> | null>(null)

  React.useLayoutEffect(() => {
    if (json && input) {
      loadJsonAndTextureAndExecuteCallback(json, input, parseSpriteData)
    } else if (input) {
      // only load the texture, this is an image sprite only
      loadStandaloneSprite()
    }

    return () => {
      if (input) {
        useLoader.clear(TextureLoader, input)
      }
    }
  }, [])

  function loadJsonAndTexture(textureUrl: string, jsonUrl?: string) {
    if (jsonUrl && textureUrl) {
      loadJsonAndTextureAndExecuteCallback(jsonUrl, textureUrl, parseSpriteData)
    } else {
      loadStandaloneSprite(textureUrl)
    }
  }

  function loadStandaloneSprite(textureUrl?: string) {
    if (textureUrl || input) {
      new Promise<THREE.Texture>((resolve) => {
        textureLoader.load(textureUrl ?? input!, resolve)
      }).then((texture) => {
        parseSpriteData(null, texture)
      })
    }
  }

  /**
   *
   */
  function loadJsonAndTextureAndExecuteCallback(
    jsonUrl: string,
    textureUrl: string,
    callback: (json: any, texture: THREE.Texture) => void
  ): void {
    const jsonPromise = fetch(jsonUrl).then((response) => response.json())
    const texturePromise = new Promise<THREE.Texture>((resolve) => {
      textureLoader.load(textureUrl, resolve)
    })

    Promise.all([jsonPromise, texturePromise]).then((response) => {
      callback(response[0], response[1])
    })
  }

  const parseSpriteData = (json: any, _spriteTexture: THREE.Texture): void => {
    let aspect = new THREE.Vector3(1, 1, 1)
    // sprite only case
    if (json === null) {
      if (_spriteTexture && numberOfFrames) {
        //get size from texture
        const width = _spriteTexture.image.width
        const height = _spriteTexture.image.height
        const frameWidth = width / numberOfFrames
        const frameHeight = height
        totalFrames.current = numberOfFrames
        spriteDataRef.current = {
          frames: [],
          meta: {
            version: '1.0',
            size: { w: width, h: height },
            scale: '1',
          },
        }

        if (parseInt(frameWidth.toString(), 10) === frameWidth) {
          // if it fits
          for (let i = 0; i < numberOfFrames; i++) {
            spriteDataRef.current.frames.push({
              frame: { x: i * frameWidth, y: 0, w: frameWidth, h: frameHeight },
              rotated: false,
              trimmed: false,
              spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
              sourceSize: { w: frameWidth, h: height },
            })
          }
        }

        aspect = calculateAspectRatio(frameWidth, frameHeight, aspectFactor, size)
      }
    } else if (_spriteTexture) {
      spriteDataRef.current = json
      spriteDataRef.current.frames = parseFrames()
      totalFrames.current = Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length
      const { w, h } = getFirstItem(json.frames).sourceSize
      aspect = calculateAspectRatio(w, h, aspectFactor, size)
    }

    setSpriteData(spriteDataRef.current)
    // @ts-ignore
    if ('encoding' in _spriteTexture) _spriteTexture.encoding = 3001 // sRGBEncoding
    // @ts-ignore
    else _spriteTexture.colorSpace = 'srgb'
    setSpriteTexture(_spriteTexture)
    setSpriteObj({
      spriteTexture: _spriteTexture,
      spriteData: spriteDataRef.current,
      aspect: aspect,
    })
  }

  // for frame based JSON Hash sprite data
  const parseFrames = (): any => {
    const sprites: any = {}
    const data = spriteDataRef.current
    const delimiters = animationNames

    if (delimiters && Array.isArray(data['frames'])) {
      for (let i = 0; i < delimiters.length; i++) {
        // we convert each named animation group into an array
        sprites[delimiters[i]] = []

        for (const value of data['frames']) {
          const frameData = value['frame']
          const x = frameData['x']
          const y = frameData['y']
          const width = frameData['w']
          const height = frameData['h']
          const sourceWidth = value['sourceSize']['w']
          const sourceHeight = value['sourceSize']['h']

          if (
            typeof value['filename'] === 'string' &&
            value['filename'].toLowerCase().indexOf(delimiters[i].toLowerCase()) !== -1
          ) {
            sprites[delimiters[i]].push({
              x: x,
              y: y,
              w: width,
              h: height,
              frame: frameData,
              sourceSize: { w: sourceWidth, h: sourceHeight },
            })
          }
        }
      }
      return sprites
    } else if (delimiters && typeof data['frames'] === 'object') {
      for (let i = 0; i < delimiters.length; i++) {
        // we convert each named animation group into an array
        sprites[delimiters[i]] = []

        for (const innerKey in data['frames']) {
          const value = data['frames'][innerKey]
          const frameData = value['frame']
          const x = frameData['x']
          const y = frameData['y']
          const width = frameData['w']
          const height = frameData['h']
          const sourceWidth = value['sourceSize']['w']
          const sourceHeight = value['sourceSize']['h']

          if (typeof innerKey === 'string' && innerKey.toLowerCase().indexOf(delimiters[i].toLowerCase()) !== -1) {
            sprites[delimiters[i]].push({
              x: x,
              y: y,
              w: width,
              h: height,
              frame: frameData,
              sourceSize: { w: sourceWidth, h: sourceHeight },
            })
          }
        }
      }
      return sprites
    } else {
      // we need to convert it into an array
      const spritesArr: any[] = []
      for (const key in data.frames) {
        spritesArr.push(data.frames[key])
      }

      return spritesArr
    }
  }

  React.useLayoutEffect(() => {
    onLoad?.(spriteTexture, spriteData)
  }, [spriteTexture, spriteData])

  return { spriteObj, loadJsonAndTexture }
}

useSpriteLoader.preload = (url: string) => useLoader.preload(TextureLoader, url)
useSpriteLoader.clear = (input: string) => useLoader.clear(TextureLoader, input)
