/* eslint react-hooks/exhaustive-deps: 1 */
import { Texture, TextureLoader } from '#three'
import { useLoader, useThree, Vector3 } from '@react-three/fiber'
import { useState } from 'react'
import * as React from 'react'
import * as THREE from '#three'

export type Size = {
  w: number
  h: number
}

export type FrameData = {
  frame: {
    x: number
    y: number
    w: number
    h: number
  }
  scaleRatio?: number
  rotated: boolean
  trimmed: boolean
  spriteSourceSize: {
    x: number
    y: number
    w: number
    h: number
  }
  sourceSize: Size
}

export type MetaData = {
  version: string
  size: {
    w: number
    h: number
  }
  rows: number
  columns: number
  frameWidth: number
  frameHeight: number
  scale: string
}

type Frames = Record<string, FrameData[]> | FrameData[]

export type SpriteData = {
  frames: Frames
  meta: MetaData
}

type SpriteMetaDimension = {
  row: number
  col: number
}

// utils
export const getFirstFrame = (frames: SpriteData['frames'], frameName?: string) => {
  if (Array.isArray(frames)) {
    return frames[0]
  } else {
    const k = frameName ?? Object.keys(frames)[0]
    return frames[k][0]
  }
}

export const checkIfFrameIsEmpty = (frameData: Uint8ClampedArray) => {
  for (let i = 3; i < frameData.length; i += 4) {
    if (frameData[i] !== 0) {
      return false
    }
  }
  return true
}

/**
 * Loads a sprite sheet and parses it for use with SpriteAnimator.
 *
 * @example Basic usage
 * ```jsx
 * const { spriteObj, texture } = useSpriteLoader('/spritesheet.png', spriteData)
 * ```
 */
export function useSpriteLoader<Url extends string>(
  /** The URL of the sprite sheet. */
  input: Url | null,
  /** The JSON data of the sprite sheet. */
  json?: string | null,
  /** The names of the animations in the sprite sheet. */
  animationNames?: string[] | null,
  /** The number of frames in the sprite sheet. */
  numberOfFrames?: number | null,
  /** A callback that is called when the sprite sheet is loaded. */
  onLoad?: (texture: Texture, textureData?: SpriteData | null) => void,
  /** The settings to use when creating the 2D context. */
  canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings
) {
  const viewportRef = React.useRef(useThree((state) => state.viewport))
  const spriteDataRef = React.useRef<SpriteData | null>(null)
  const totalFrames = React.useRef(0)
  const aspectFactor = 0.1
  const inputRef = React.useRef(input)
  const jsonRef = React.useRef(json)
  const animationFramesRef = React.useRef(animationNames)
  const [spriteData, setSpriteData] = useState<SpriteData | null>(null)
  const [spriteTexture, setSpriteTexture] = React.useState<THREE.Texture>(new THREE.Texture())
  const textureLoader = React.useMemo(() => new THREE.TextureLoader(), [])
  const [spriteObj, setSpriteObj] = useState<{
    spriteTexture: THREE.Texture
    spriteData: SpriteData | null
    aspect: Vector3
  } | null>(null)

  const calculateAspectRatio = React.useCallback((width: number, height: number, factor: number) => {
    const adaptedHeight =
      height *
      (viewportRef.current.aspect > width / height
        ? viewportRef.current.width / width
        : viewportRef.current.height / height)
    const adaptedWidth =
      width *
      (viewportRef.current.aspect > width / height
        ? viewportRef.current.width / width
        : viewportRef.current.height / height)
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
  }, [])

  const getRowsAndColumns = React.useCallback(
    (texture: THREE.Texture, totalFrames: number) => {
      if (texture.image) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', canvasRenderingContext2DSettings)

        if (!ctx) {
          throw new Error('Failed to get 2d context')
        }

        const img = texture.image as HTMLImageElement
        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)

        const width = img.width
        const height = img.height

        // Calculate rows and columns based on the number of frames and image dimensions
        const cols = Math.round(Math.sqrt(totalFrames * (width / height)))
        const rows = Math.round(totalFrames / cols)

        const frameWidth = width / cols
        const frameHeight = height / rows

        const emptyFrames: SpriteMetaDimension[] = []

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const frameIndex = row * cols + col

            if (frameIndex >= totalFrames) {
              emptyFrames.push({ row, col })
              continue
            }

            const frameData = ctx.getImageData(col * frameWidth, row * frameHeight, frameWidth, frameHeight).data

            const isEmpty = checkIfFrameIsEmpty(frameData)
            if (isEmpty) {
              emptyFrames.push({ row, col })
            }
          }
        }

        return { rows, columns: cols, frameWidth, frameHeight, emptyFrames }
      } else {
        return { rows: 0, columns: 0, frameWidth: 0, frameHeight: 0, emptyFrames: [] }
      }
    },
    [canvasRenderingContext2DSettings]
  )

  // calculate scale ratio for the frames
  const calculateScaleRatio = React.useCallback((frames: FrameData[] | Record<string, FrameData[]>) => {
    // Helper function to calculate scale ratio for an array of frames
    const processFrameArray = (frameArray: FrameData[]) => {
      // Find the largest frame
      let largestFrame: { w: number; h: number; area: number } | null = null

      for (const frame of frameArray) {
        const { w, h } = frame.frame
        const area = w * h
        if (!largestFrame || area > largestFrame.area) {
          largestFrame = { w, h, area }
        }
      }

      // Set scaleRatio property on each frame
      const frameArr: FrameData[] = frameArray.map((frame) => {
        const { w, h } = frame.frame
        const area = w * h
        const scaleRatio = largestFrame ? (area === largestFrame.area ? 1 : Math.sqrt(area / largestFrame.area)) : 1

        return {
          ...frame,
          scaleRatio,
        }
      })

      return frameArr
    }

    // Handle both array and record cases
    if (Array.isArray(frames)) {
      return processFrameArray(frames)
    } else {
      const result: Record<string, FrameData[]> = {}
      for (const key in frames) {
        result[key] = processFrameArray(frames[key])
      }
      return result
    }
  }, [])

  // for frame based JSON Hash sprite data
  const parseFrames = React.useCallback(() => {
    const sprites: Record<string, FrameData[]> = {}
    const data = spriteDataRef.current
    const delimiters = animationFramesRef.current

    if (data) {
      if (delimiters && Array.isArray(data['frames'])) {
        for (let i = 0; i < delimiters.length; i++) {
          // we convert each named animation group into an array
          sprites[delimiters[i]] = []

          for (const value of data['frames']) {
            const frameData = value['frame']
            const sourceWidth = value['sourceSize']['w']
            const sourceHeight = value['sourceSize']['h']

            if (
              typeof value['filename'] === 'string' &&
              value['filename'].toLowerCase().indexOf(delimiters[i].toLowerCase()) !== -1
            ) {
              sprites[delimiters[i]].push({
                ...value,
                frame: frameData,
                sourceSize: { w: sourceWidth, h: sourceHeight },
              })
            }
          }
        }

        for (const frame in sprites) {
          const scaleRatioData = calculateScaleRatio(sprites[frame])
          if (Array.isArray(scaleRatioData)) {
            sprites[frame] = scaleRatioData
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
            const sourceWidth = value['sourceSize']['w']
            const sourceHeight = value['sourceSize']['h']

            if (typeof innerKey === 'string' && innerKey.toLowerCase().indexOf(delimiters[i].toLowerCase()) !== -1) {
              sprites[delimiters[i]].push({
                ...value,
                frame: frameData,
                sourceSize: { w: sourceWidth, h: sourceHeight },
              })
            }
          }
        }
        for (const frame in sprites) {
          const scaleRatioData = calculateScaleRatio(sprites[frame])
          if (Array.isArray(scaleRatioData)) {
            sprites[frame] = scaleRatioData
          }
        }

        return sprites
      } else {
        let spritesArr: FrameData[] = []

        if (data?.frames) {
          if (Array.isArray(data.frames)) {
            spritesArr = data.frames.map((frame) => ({
              ...frame,
              x: frame.frame.x,
              y: frame.frame.y,
              w: frame.frame.w,
              h: frame.frame.h,
            }))
          } else {
            spritesArr = Object.values(data.frames)
              .flat()
              .map((frame) => ({
                ...frame,
                x: frame.frame.x,
                y: frame.frame.y,
                w: frame.frame.w,
                h: frame.frame.h,
              }))
          }
        }

        return calculateScaleRatio(spritesArr)
      }
    }

    return []
  }, [calculateScaleRatio, spriteDataRef])

  const parseSpriteData = React.useCallback(
    (json: SpriteData | null, _spriteTexture: THREE.Texture) => {
      let aspect = new THREE.Vector3(1, 1, 1)
      // sprite only case
      if (json === null) {
        if (_spriteTexture && numberOfFrames) {
          //get size from texture
          const img = _spriteTexture.image as { width: number; height: number }
          const width = img.width
          const height = img.height
          totalFrames.current = numberOfFrames
          const { rows, columns, frameWidth, frameHeight, emptyFrames } = getRowsAndColumns(
            _spriteTexture,
            numberOfFrames
          )
          const nonJsonFrames: SpriteData = {
            frames: [],
            meta: {
              version: '1.0',
              size: { w: width, h: height },
              rows,
              columns,
              frameWidth,
              frameHeight,
              scale: '1',
            },
          }

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              const isExcluded = (emptyFrames ?? []).some((coord) => coord.row === row && coord.col === col)

              if (isExcluded) {
                continue
              }

              if (Array.isArray(nonJsonFrames.frames)) {
                nonJsonFrames.frames.push({
                  frame: {
                    x: col * frameWidth,
                    y: row * frameHeight,
                    w: frameWidth,
                    h: frameHeight,
                  },
                  scaleRatio: 1,
                  rotated: false,
                  trimmed: false,
                  spriteSourceSize: {
                    x: 0,
                    y: 0,
                    w: frameWidth,
                    h: frameHeight,
                  },
                  sourceSize: {
                    w: frameWidth,
                    h: frameHeight,
                  },
                })
              }
            }
          }

          aspect = calculateAspectRatio(frameWidth, frameHeight, aspectFactor)

          spriteDataRef.current = nonJsonFrames
        }

        //scale ratio for standalone sprite
        if (spriteDataRef.current && spriteDataRef.current.frames) {
          spriteDataRef.current.frames = calculateScaleRatio(spriteDataRef.current.frames)
        }
      } else if (_spriteTexture) {
        spriteDataRef.current = json
        spriteDataRef.current.frames = parseFrames()

        totalFrames.current = Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length
        const { w, h } = getFirstFrame(json.frames).sourceSize
        aspect = calculateAspectRatio(w, h, aspectFactor)
      }

      setSpriteData(spriteDataRef.current)

      if ('encoding' in _spriteTexture) {
        _spriteTexture.encoding = 3001 // sRGBEncoding
      } else if ('colorSpace' in _spriteTexture) {
        //@ts-ignore
        _spriteTexture.colorSpace = THREE.SRGBColorSpace
      }

      setSpriteTexture(_spriteTexture)
      setSpriteObj({
        spriteTexture: _spriteTexture,
        spriteData: spriteDataRef.current,
        aspect: aspect,
      })
    },
    [getRowsAndColumns, numberOfFrames, parseFrames, calculateAspectRatio, calculateScaleRatio]
  )

  /**
   *
   */
  const loadJsonAndTextureAndExecuteCallback = React.useCallback(
    (jsonUrl: string, textureUrl: string, callback: (json: SpriteData, texture: THREE.Texture) => void): void => {
      const jsonPromise = fetch(jsonUrl).then((response) => response.json())
      const texturePromise = new Promise<THREE.Texture>((resolve) => {
        textureLoader.load(textureUrl, resolve)
      })

      Promise.all([jsonPromise, texturePromise]).then((response) => {
        callback(response[0], response[1])
      })
    },
    [textureLoader]
  )

  const loadStandaloneSprite = React.useCallback(
    (textureUrl?: string) => {
      if (!textureUrl && !inputRef.current) {
        throw new Error('Either textureUrl or input must be provided')
      }

      const validUrl = textureUrl ?? inputRef.current
      if (!validUrl) {
        throw new Error('A valid texture URL must be provided')
      }

      textureLoader.load(validUrl, (texture) => parseSpriteData(null, texture))
    },
    [textureLoader, parseSpriteData]
  )

  const loadJsonAndTexture = React.useCallback(
    (textureUrl: string, jsonUrl?: string) => {
      if (jsonUrl && textureUrl) {
        loadJsonAndTextureAndExecuteCallback(jsonUrl, textureUrl, parseSpriteData)
      } else {
        loadStandaloneSprite(textureUrl)
      }
    },
    [loadJsonAndTextureAndExecuteCallback, loadStandaloneSprite, parseSpriteData]
  )

  React.useLayoutEffect(() => {
    if (jsonRef.current && inputRef.current) {
      loadJsonAndTextureAndExecuteCallback(jsonRef.current, inputRef.current, parseSpriteData)
    } else if (inputRef.current) {
      // only load the texture, this is an image sprite only
      loadStandaloneSprite()
    }

    const _inputRef = inputRef.current

    return () => {
      if (_inputRef) {
        useLoader.clear(TextureLoader, _inputRef)
      }
    }
  }, [loadJsonAndTextureAndExecuteCallback, loadStandaloneSprite, parseSpriteData])

  React.useLayoutEffect(() => {
    onLoad?.(spriteTexture, spriteData ?? null)
  }, [spriteTexture, spriteData, onLoad])

  return { spriteObj, loadJsonAndTexture }
}

useSpriteLoader.preload = (url: string) => useLoader.preload(TextureLoader, url)
useSpriteLoader.clear = (input: string) => useLoader.clear(TextureLoader, input)
