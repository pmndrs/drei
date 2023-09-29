import * as React from 'react'
import { useFrame, useThree, Vector3 } from '@react-three/fiber'
import * as THREE from 'three'

type SpriteAnimatorProps = JSX.IntrinsicElements['group'] & {
  startFrame?: number
  endFrame?: number
  fps?: number
  frameName?: string
  textureDataURL?: string
  textureImageURL?: string
  loop?: boolean
  numberOfFrames?: number
  autoPlay?: boolean
  animationNames?: Array<string>
  onStart?: Function
  onEnd?: Function
  onLoopEnd?: Function
  onFrame?: Function
  pause?: boolean
  flipX?: boolean
  position?: Array<number>
  alphaTest?: number
  asSprite?: boolean
  offset?: number
  playBackwards?: boolean
} & JSX.IntrinsicElements['group']

type SpriteAnimatorState = {
  /** The user-defined, mutable, current goal position along the curve, it may be >1 or <0 */
  current: number | undefined
  /** The 0-1 normalised and damped current goal position along curve */
  offset: number | undefined
}

const context = React.createContext<SpriteAnimatorState>(null!)

export function useSpriteAnimator() {
  return React.useContext(context) as SpriteAnimatorState
}

export const SpriteAnimator = React.forwardRef<THREE.Group>(
  (
    {
      startFrame = 0,
      endFrame,
      fps,
      frameName,
      textureDataURL,
      textureImageURL,
      loop,
      numberOfFrames,
      autoPlay,
      animationNames,
      onStart,
      onEnd,
      onLoopEnd,
      onFrame,
      pause,
      flipX,
      alphaTest,
      children,
      asSprite,
      offset,
      playBackwards,
      ...props
    }: SpriteAnimatorProps,
    fref
  ) => {
    const ref = React.useRef<any>()
    const spriteData = React.useRef<any>(null)
    const [isJsonReady, setJsonReady] = React.useState(false)
    const hasEnded = React.useRef(false)
    const matRef = React.useRef<any>()
    const spriteRef = React.useRef<any>()
    const timerOffset = React.useRef(window.performance.now())
    const textureData = React.useRef<any>()
    const currentFrame = React.useRef<number>(startFrame || 0)
    const currentFrameName = React.useRef<string>(frameName || '')
    const fpsInterval = 1000 / (fps || 30)
    const [spriteTexture, setSpriteTexture] = React.useState<THREE.Texture>(new THREE.Texture())
    const totalFrames = React.useRef<number>(0)
    const [aspect, setAspect] = React.useState<Vector3 | undefined>([1, 1, 1])
    const flipOffset = flipX ? -1 : 1
    const [displayAsSprite, setDisplayAsSprite] = React.useState(asSprite ?? true)
    const pos = React.useRef(offset)
    const softEnd = React.useRef(false)

    function reset() { }

    const state = React.useMemo<SpriteAnimatorState>(
      () => ({
        current: pos.current,
        offset: pos.current,
        imageUrl: textureImageURL,
        reset: reset,
      }),
      [textureImageURL]
    )

    React.useImperativeHandle(fref, () => ref.current, [])

    React.useLayoutEffect(() => {
      pos.current = offset
    }, [offset])

    function loadJsonAndTextureAndExecuteCallback(
      jsonUrl: string,
      textureUrl: string,
      callback: (json: any, texture: THREE.Texture) => void
    ): void {
      const textureLoader = new THREE.TextureLoader()
      const jsonPromise = fetch(jsonUrl).then((response) => response.json())
      const texturePromise = new Promise<THREE.Texture>((resolve) => {
        textureLoader.load(textureUrl, resolve)
      })

      Promise.all([jsonPromise, texturePromise]).then((response) => {
        callback(response[0], response[1])
      })
    }

    const calculateAspectRatio = (width: number, height: number): Vector3 => {
      const aspectRatio = height / width
      spriteRef.current.scale.set(1, aspectRatio, 1)
      return [1, aspectRatio, 1]
    }

    // initial loads
    React.useEffect(() => {
      if (textureDataURL && textureImageURL) {
        loadJsonAndTextureAndExecuteCallback(textureDataURL, textureImageURL, parseSpriteData)
      } else if (textureImageURL) {
        // only load the texture, this is an image sprite only
        const textureLoader = new THREE.TextureLoader()
        new Promise<THREE.Texture>((resolve) => {
          textureLoader.load(textureImageURL, resolve)
        }).then((texture) => {
          parseSpriteData(null, texture)
        })
      }
    }, [])

    React.useEffect(() => {
      setDisplayAsSprite(asSprite ?? true)
    }, [asSprite])

    React.useEffect(() => {
      hasEnded.current = false
      if (spriteData.current && playBackwards === true) {
        currentFrame.current = spriteData.current.frames.length - 1
      } else {
        currentFrame.current = 0
      }
    }, [playBackwards])

    React.useLayoutEffect(() => {
      modifySpritePosition()
    }, [spriteTexture, flipX])

    React.useEffect(() => {
      if (currentFrameName.current !== frameName && frameName) {
        currentFrame.current = 0
        currentFrameName.current = frameName
        hasEnded.current = false
      }
    }, [frameName])

    const parseSpriteData = (json: any, _spriteTexture: THREE.Texture): void => {
      // sprite only case
      if (json === null) {
        if (_spriteTexture && numberOfFrames) {
          //get size from texture
          const width = _spriteTexture.image.width
          const height = _spriteTexture.image.height
          const frameWidth = width / numberOfFrames
          const frameHeight = height
          textureData.current = _spriteTexture
          totalFrames.current = numberOfFrames

          if (playBackwards) {
            currentFrame.current = numberOfFrames - 1
          }
          spriteData.current = {
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
              spriteData.current.frames.push({
                frame: { x: i * frameWidth, y: 0, w: frameWidth, h: frameHeight },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
                sourceSize: { w: frameWidth, h: height },
              })
            }
          }
        }
      } else if (_spriteTexture) {
        spriteData.current = json
        spriteData.current.frames = Array.isArray(json.frames) ? json.frames : parseFrames()
        totalFrames.current = Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length
        textureData.current = _spriteTexture

        if (playBackwards) {
          currentFrame.current = totalFrames.current - 1
        }

        const { w, h } = getFirstItem(json.frames).sourceSize
        const aspect = calculateAspectRatio(w, h)

        setAspect(aspect)
        if (matRef.current) {
          matRef.current.map = _spriteTexture
        }
      }

      _spriteTexture.premultiplyAlpha = false

      setSpriteTexture(_spriteTexture)
    }

    // for frame based JSON Hash sprite data
    const parseFrames = (): any => {
      const sprites: any = {}
      const data = spriteData.current
      const delimiters = animationNames
      if (delimiters) {
        for (let i = 0; i < delimiters.length; i++) {
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
      }

      return sprites
    }

    // modify the sprite material after json is parsed and state updated
    const modifySpritePosition = (): void => {
      if (!spriteData.current) return
      const {
        meta: { size: metaInfo },
        frames,
      } = spriteData.current

      const { w: frameW, h: frameH } = Array.isArray(frames)
        ? frames[0].sourceSize
        : frameName
          ? frames[frameName]
            ? frames[frameName][0].sourceSize
            : { w: 0, h: 0 }
          : { w: 0, h: 0 }

      matRef.current.map.wrapS = matRef.current.map.wrapT = THREE.RepeatWrapping
      matRef.current.map.center.set(0, 0)
      matRef.current.map.repeat.set((1 * flipOffset) / (metaInfo.w / frameW), 1 / (metaInfo.h / frameH))

      //const framesH = (metaInfo.w - 1) / frameW
      const framesV = (metaInfo.h - 1) / frameH
      const frameOffsetY = 1 / framesV
      matRef.current.map.offset.x = 0.0 //-matRef.current.map.repeat.x
      matRef.current.map.offset.y = 1 - frameOffsetY

      setJsonReady(true)
      if (onStart && autoPlay) onStart({ currentFrameName: frameName, currentFrame: currentFrame.current })
    }

    // utils
    const getFirstItem = (param: any): any => {
      if (Array.isArray(param)) {
        return param[0]
      } else if (typeof param === 'object' && param !== null) {
        const keys = Object.keys(param)
        return param[keys[0]][0]
      } else {
        return { w: 0, h: 0 }
      }
    }

    // run the animation on each frame
    const runAnimation = (): void => {
      //if (!frameName) return
      const now = window.performance.now()
      const diff = now - timerOffset.current
      const {
        meta: { size: metaInfo },
        frames,
      } = spriteData.current
      const { w: frameW, h: frameH } = getFirstItem(frames).sourceSize
      const spriteFrames = Array.isArray(frames) ? frames : frameName ? frames[frameName] : []

      let finalValX = 0
      let finalValY = 0
      const _endFrame = endFrame || spriteFrames.length - 1
      const targetFrame = currentFrame.current
      var _offset = offset === undefined ? state.current : offset

      // conditionals to support backwards play
      var endCondition = playBackwards ? currentFrame.current < 0 : currentFrame.current > _endFrame
      var onStartCondition = playBackwards ? currentFrame.current === _endFrame : currentFrame.current === 0
      var manualProgressEndCondition = playBackwards ? currentFrame.current < 0 : currentFrame.current >= _endFrame

      if (endCondition) {
        currentFrame.current = loop ? startFrame ?? 0 : 0

        if (playBackwards) {
          currentFrame.current = _endFrame
        }

        if (loop) {
          onLoopEnd?.({
            currentFrameName: frameName,
            currentFrame: currentFrame.current,
          })
        } else {
          onEnd?.({
            currentFrameName: frameName,
            currentFrame: currentFrame.current,
          })

          if (!_offset) {
            hasEnded.current = true
          }
        }
        if (!loop) return
      } else if (onStartCondition) {
        onStart?.({
          currentFrameName: frameName,
          currentFrame: currentFrame.current,
        })
      }

      // for manual update
      if (_offset !== undefined && manualProgressEndCondition) {
        if (softEnd.current === false) {
          onEnd?.({
            currentFrameName: frameName,
            currentFrame: currentFrame.current,
          })
          softEnd.current = true
        }
      } else {
        // same for start?
        softEnd.current = false
      }

      if (diff <= fpsInterval) return
      timerOffset.current = now - (diff % fpsInterval)

      calculateAspectRatio(frameW, frameH)
      const framesH = (metaInfo.w - 1) / frameW
      const framesV = (metaInfo.h - 1) / frameH

      // read the sprite on the currentFrame position
      const {
        frame: { x: frameX, y: frameY },
        sourceSize: { w: originalSizeX, h: originalSizeY },
      } = spriteFrames[targetFrame]

      const frameOffsetX = 1 / framesH
      const frameOffsetY = 1 / framesV
      finalValX =
        flipOffset > 0
          ? frameOffsetX * (frameX / originalSizeX)
          : frameOffsetX * (frameX / originalSizeX) - matRef.current.map.repeat.x
      finalValY = Math.abs(1 - frameOffsetY) - frameOffsetY * (frameY / originalSizeY)

      matRef.current.map.offset.x = finalValX
      matRef.current.map.offset.y = finalValY

      if (_offset !== undefined && _offset !== null) {
        // Calculate the frame index
        let frameIndex = Math.floor(_offset * spriteFrames.length)

        // Ensure the frame index is within the valid range
        frameIndex = Math.max(0, Math.min(frameIndex, spriteFrames.length - 1))

        if (isNaN(frameIndex)) {
          console.log('nan frame detected')
          frameIndex = 0 //fallback
        }
        currentFrame.current = frameIndex
      } else {
        // auto update
        if (playBackwards) {
          currentFrame.current -= 1
        } else {
          currentFrame.current += 1
        }
      }
    }

    // *** Warning! It runs on every frame! ***
    useFrame((state, delta) => {
      if (!spriteData.current?.frames || !matRef.current?.map) {
        return
      }

      if (pause) {
        return
      }

      if (!hasEnded.current && autoPlay) {
        runAnimation()
        onFrame && onFrame({ currentFrameName: currentFrameName.current, currentFrame: currentFrame.current })
      }
    })

    return (
      <group {...props} ref={ref}>
        <context.Provider value={state}>
          <React.Suspense fallback={null}>
            {displayAsSprite && (
              <sprite ref={spriteRef} scale={aspect}>
                <spriteMaterial
                  toneMapped={false}
                  ref={matRef}
                  map={spriteTexture}
                  transparent={true}
                  alphaTest={alphaTest ?? 0.01}
                />
              </sprite>
            )}
            {!displayAsSprite && (
              <mesh ref={spriteRef} scale={aspect}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                  toneMapped={false}
                  side={THREE.DoubleSide}
                  ref={matRef}
                  map={spriteTexture}
                  transparent={true}
                  alphaTest={alphaTest ?? 0.01}
                />
              </mesh>
            )}
          </React.Suspense>
          {children}
        </context.Provider>
      </group>
    )
  }
)
