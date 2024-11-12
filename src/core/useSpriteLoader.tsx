/* eslint react-hooks/exhaustive-deps: 1 */
import { Texture, TextureLoader } from 'three'
import { RootState, useLoader, useThree, Vector3 } from '@react-three/fiber'
import { useState } from 'react'
import * as React from 'react'
import * as THREE from 'three'

type AnimationNames = string[] | null
type NumberOfFrames = number | null

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

type SpriteObj = {
  spriteTexture: THREE.Texture
  spriteData: SpriteData | null
  aspect: Vector3
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

const calculateAspectRatio = (width: number, height: number, factor: number, viewport: RootState['viewport']) => {
  const adaptedHeight = height * (viewport.aspect > width / height ? viewport.width / width : viewport.height / height)
  const adaptedWidth = width * (viewport.aspect > width / height ? viewport.width / width : viewport.height / height)
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

// calculate scale ratio for the frames
const calculateScaleRatio = (frames: SpriteData['frames']) => {
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
}

const getRowsAndColumns = (
  texture: THREE.Texture,
  totalFrames: number,
  canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings
) => {
  if (texture.image) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', canvasRenderingContext2DSettings)

    if (!ctx) {
      throw new Error('Failed to get 2d context')
    }

    canvas.width = texture.image.width
    canvas.height = texture.image.height

    ctx.drawImage(texture.image, 0, 0)

    const width = texture.image.width
    const height = texture.image.height

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
}

// for frame based JSON Hash sprite data
const parseFrames = (data: SpriteData, delimiters?: AnimationNames) => {
  const sprites: Record<string, FrameData[]> = {}

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
}

const parseSpriteData = (
  json: SpriteData | null,
  texture: THREE.Texture,
  viewport: RootState['viewport'],
  numberOfFrames?: NumberOfFrames,
  canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings,
  animationNames?: AnimationNames
) => {
  const aspectFactor = 0.1

  let spriteData: SpriteData | null = null
  let aspect = new THREE.Vector3(1, 1, 1)
  let totalFrames: number | undefined = undefined

  // if ('encoding' in texture) {
  //   texture.encoding = 3001 // sRGBEncoding
  // } else if ('colorSpace' in texture) {
  //   //@ts-ignore
  //   texture.colorSpace = THREE.SRGBColorSpace
  // }

  // sprite only case
  if (json === null) {
    if (texture && numberOfFrames) {
      //get size from texture
      const width = texture.image.width
      const height = texture.image.height
      totalFrames = numberOfFrames
      const { rows, columns, frameWidth, frameHeight, emptyFrames } = getRowsAndColumns(
        texture,
        numberOfFrames,
        canvasRenderingContext2DSettings
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

      aspect = calculateAspectRatio(frameWidth, frameHeight, aspectFactor, viewport)

      spriteData = nonJsonFrames
    }

    //scale ratio for standalone sprite
    if (spriteData?.frames) {
      spriteData.frames = calculateScaleRatio(spriteData.frames)
    }
  } else if (texture) {
    spriteData = json
    spriteData.frames = parseFrames(spriteData, animationNames)

    totalFrames = Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length
    const { w, h } = getFirstFrame(json.frames).sourceSize
    aspect = calculateAspectRatio(w, h, aspectFactor, viewport)
  }

  return {
    spriteData,
    aspect,
    totalFrames,
  }
}

const textureLoader = new THREE.TextureLoader()

export function useSpriteLoader(
  /** The URL of the sprite sheet. */
  input: string,
  /** The JSON data of the sprite sheet. */
  json?: string | null,
  /** The names of the animations in the sprite sheet. */
  animationNames?: AnimationNames,
  /** The number of frames in the sprite sheet. */
  numberOfFrames?: NumberOfFrames,
  /** A callback that is called when the sprite sheet is loaded. */
  onLoad?: (texture: Texture, textureData?: SpriteData | null) => void,
  /** The settings to use when creating the 2D context. */
  canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings
) {
  const viewport = useThree((state) => state.viewport)
  const [spriteObj, setSpriteObj] = useState<SpriteObj | null>(null)

  const loadJsonAndTexture = React.useCallback(async () => {
    const data = json ? ((await (await fetch(json)).json()) as SpriteData) : null
    const texture = await new Promise<Texture>((resolve) => textureLoader.load(input, resolve))

    const { spriteData, aspect } = parseSpriteData(
      data,
      texture,
      viewport,
      numberOfFrames,
      canvasRenderingContext2DSettings,
      animationNames
    )
    setSpriteObj({
      spriteTexture: texture,
      spriteData,
      aspect,
    })

    onLoad?.(texture, spriteData)
  }, [animationNames, canvasRenderingContext2DSettings, input, json, numberOfFrames, onLoad, viewport])

  return { spriteObj, loadJsonAndTexture }
}

useSpriteLoader.preload = (url: string) => useLoader.preload(TextureLoader, url)
useSpriteLoader.clear = (input: string) => useLoader.clear(TextureLoader, input)
