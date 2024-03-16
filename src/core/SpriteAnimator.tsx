import * as React from 'react'
import { useFrame, Vector3 } from '@react-three/fiber'
import * as THREE from 'three'
import { Instances, Instance } from './Instances'
import { useSpriteLoader } from './useSpriteLoader'

export type SpriteAnimatorProps = {
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
  play?: boolean
  pause?: boolean
  flipX?: boolean
  position?: Array<number>
  alphaTest?: number
  asSprite?: boolean
  offset?: number
  playBackwards?: boolean
  resetOnEnd?: boolean
  maxItems?: number
  instanceItems?: any[]
  spriteDataset?: any
} & JSX.IntrinsicElements['group']

type SpriteAnimatorState = {
  /** The user-defined, mutable, current goal position along the curve, it may be >1 or <0 */
  current: number | undefined
  /** The 0-1 normalised and damped current goal position along curve */
  offset: number | undefined
  hasEnded: boolean | undefined
  ref: React.MutableRefObject<any> | undefined | null | ((instance: any) => void)
}

type Scale = number | [number, number, number] | Vector3

const context = React.createContext<SpriteAnimatorState>(null!)

export function useSpriteAnimator() {
  return React.useContext(context) as SpriteAnimatorState
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = /* @__PURE__ */ React.forwardRef(
  (
    {
      startFrame,
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
      play,
      pause,
      flipX,
      alphaTest,
      children,
      asSprite,
      offset,
      playBackwards,
      resetOnEnd,
      maxItems,
      instanceItems,
      spriteDataset,
      ...props
    },
    fref
  ) => {
    const ref = React.useRef<any>()
    const spriteData = React.useRef<any>(null)
    const matRef = React.useRef<any>()
    const spriteRef = React.useRef<any>()
    const timerOffset = React.useRef(window.performance.now())
    const currentFrame = React.useRef<number>(startFrame || 0)
    const currentFrameName = React.useRef<string>(frameName || '')
    const fpsInterval = 1000 / (fps || 30)
    const [spriteTexture, setSpriteTexture] = React.useState<THREE.Texture>(new THREE.Texture())
    const totalFrames = React.useRef<number>(0)
    const [aspect, setAspect] = React.useState<number[] | null>([1, 1, 1])
    const flipOffset = flipX ? -1 : 1
    const [displayAsSprite, setDisplayAsSprite] = React.useState(asSprite ?? true)
    const pauseRef = React.useRef(pause)
    const pos = React.useRef(offset)
    const softEnd = React.useRef(false)
    const frameBuffer = React.useRef<any[]>([])
    const { spriteObj, loadJsonAndTexture } = useSpriteLoader(null, null, animationNames, numberOfFrames)
    //

    function reset() {}

    const state = React.useMemo<SpriteAnimatorState>(
      () => ({
        current: pos.current,
        offset: pos.current,
        imageUrl: textureImageURL,
        reset: reset,
        hasEnded: false,
        ref: fref,
      }),
      [textureImageURL, spriteDataset]
    )

    React.useImperativeHandle(fref, () => ref.current, [])

    React.useLayoutEffect(() => {
      pos.current = offset
    }, [offset])

    const calculateAspectRatio = (width: number, height: number): number[] => {
      const aspectRatio = height / width
      if (spriteRef.current) {
        spriteRef.current.scale.set(1, aspectRatio, 1)
      }
      return [1, aspectRatio, 1]
    }

    // initial loads
    React.useEffect(() => {
      if (spriteDataset) {
        parseSpriteDataLite(spriteDataset?.spriteTexture?.clone(), spriteDataset.spriteData)
      } else {
        loadJsonAndTexture(textureImageURL, textureDataURL)
      }
    }, [spriteDataset])

    React.useEffect(() => {
      if (spriteObj) {
        parseSpriteDataLite(spriteObj?.spriteTexture?.clone(), spriteObj?.spriteData)
      }
    }, [spriteObj])

    React.useEffect(() => {
      setDisplayAsSprite(asSprite ?? true)
    }, [asSprite])

    // support backwards play
    React.useEffect(() => {
      state.hasEnded = false
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
      if (autoPlay) {
        pauseRef.current = false
      }
    }, [autoPlay])

    React.useLayoutEffect(() => {
      if (currentFrameName.current !== frameName && frameName) {
        currentFrame.current = 0
        currentFrameName.current = frameName
        state.hasEnded = false
        // modifySpritePosition()
        if (spriteData.current) {
          const { w, h } = getFirstItem(spriteData.current.frames).sourceSize
          const _aspect = calculateAspectRatio(w, h)
          setAspect(_aspect)
        }
      }
    }, [frameName])

    // lite version for pre-loaded assets
    const parseSpriteDataLite = (textureData: THREE.Texture, frameData: any = null) => {
      if (frameData === null) {
        if (numberOfFrames) {
          //get size from texture
          const width = textureData.image.width
          const height = textureData.image.height

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

          spriteData.current.frames = frameData
        }
      } else {
        spriteData.current = frameData
        totalFrames.current = spriteData.current.frames.length

        if (playBackwards) {
          currentFrame.current = totalFrames.current - 1
        }

        const { w, h } = getFirstItem(spriteData.current.frames).sourceSize
        const aspect = calculateAspectRatio(w, h)

        setAspect(aspect)
        if (matRef.current) {
          matRef.current.map = textureData
        }
      }

      // buffer for instanced
      if (instanceItems) {
        for (var i = 0; i < instanceItems.length; i++) {
          const keys = Object.keys(spriteData.current.frames)
          const randomKey = keys[Math.floor(Math.random() * keys.length)]

          frameBuffer.current.push({
            key: i,
            frames: spriteData.current.frames,
            selectedFrame: randomKey,
            offset: { x: 0, y: 0 },
          })
        }
      }

      setSpriteTexture(textureData)
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

      if (onStart) {
        onStart({
          currentFrameName: frameName,
          currentFrame: currentFrame.current,
        })
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
      const _endFrame = endFrame || spriteFrames.length - 1

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

          state.hasEnded = resetOnEnd ? false : true
          if (resetOnEnd) {
            pauseRef.current = true
            //calculateFinalPosition(frameW, frameH, metaInfo, spriteFrames)
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

      // clock to limit fps
      if (diff <= fpsInterval) return
      timerOffset.current = now - (diff % fpsInterval)

      calculateFinalPosition(frameW, frameH, metaInfo, spriteFrames)
    }

    const calculateFinalPosition = (
      frameW: number,
      frameH: number,
      metaInfo: { w: number; h: number },
      spriteFrames: {
        frame: { x: any; y: any }
        sourceSize: { w: any; h: any }
      }[]
    ) => {
      // get the manual update offset to find the next frame
      var _offset = offset === undefined ? state.current : offset
      const targetFrame = currentFrame.current
      let finalValX = 0
      let finalValY = 0
      calculateAspectRatio(frameW, frameH)
      const framesH = Math.round((metaInfo.w - 1) / frameW)
      const framesV = Math.round((metaInfo.h - 1) / frameH)
      if (!spriteFrames[targetFrame]) {
        return
      }

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

      // if manual update is active
      if (_offset !== undefined && _offset !== null) {
        // Calculate the frame index, based on offset given from the provider
        let frameIndex = Math.floor(_offset * spriteFrames.length)

        // Ensure the frame index is within the valid range
        frameIndex = Math.max(0, Math.min(frameIndex, spriteFrames.length - 1))

        if (isNaN(frameIndex)) {
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
    useFrame((_state, _delta) => {
      if (!spriteData.current?.frames || !matRef.current?.map) {
        return
      }

      if (pauseRef.current) {
        return
      }

      if (!state.hasEnded && (autoPlay || play)) {
        runAnimation()
        onFrame &&
          onFrame({
            currentFrameName: currentFrameName.current,
            currentFrame: currentFrame.current,
          })
      }
    })

    // utils
    const getFirstItem = (param: any): any => {
      if (Array.isArray(param)) {
        return param[0]
      } else if (typeof param === 'object' && param !== null) {
        const keys = Object.keys(param)
        return frameName ? param[frameName][0] : param[keys[0]][0]
      } else {
        return { w: 0, h: 0 }
      }
    }

    function multiplyScale(initialScale: number[], newScale: Scale): number[] {
      let _newScale: number[] = []

      // If newScale is a single number, convert it to a Vector3
      if (typeof newScale === 'number') {
        _newScale = [newScale, newScale, newScale]
      } else if (Array.isArray(newScale)) {
        // If newScale is an array, convert it to a Vector3
        _newScale = newScale
      } else if (newScale instanceof THREE.Vector3) {
        _newScale = [newScale.x, newScale.y, newScale.z]
      }

      // Multiply the scale values element-wise
      const result = initialScale.map((value, index) => value * _newScale[index])
      // Convert the result to an array of numbers
      return result
    }

    return (
      <group
        {...props}
        ref={ref}
        scale={multiplyScale(aspect ?? [1, 1, 1], props.scale ?? 1.0) as [number, number, number]}
      >
        <context.Provider value={state}>
          <React.Suspense fallback={null}>
            {displayAsSprite && (
              <sprite ref={spriteRef} scale={1.0}>
                <spriteMaterial
                  premultipliedAlpha={false}
                  toneMapped={false}
                  ref={matRef}
                  map={spriteTexture}
                  transparent={true}
                  alphaTest={alphaTest ?? 0.0}
                />
              </sprite>
            )}
            {!displayAsSprite && (
              <Instances
                limit={maxItems ?? 1} // Optional: max amount of items (for calculating buffer size)
              >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                  premultipliedAlpha={false}
                  toneMapped={false}
                  side={THREE.DoubleSide}
                  ref={matRef}
                  map={spriteTexture}
                  transparent={true}
                  alphaTest={alphaTest ?? 0.0}
                />

                {(instanceItems ?? [0]).map((item, index) => {
                  return (
                    <Instance
                      key={index}
                      ref={instanceItems?.length === 1 ? spriteRef : null}
                      position={item}
                      scale={1.0}
                    ></Instance>
                  )
                })}
              </Instances>
            )}
          </React.Suspense>
          {children}
        </context.Provider>
      </group>
    )
  }
)
