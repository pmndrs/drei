import * as React from 'react'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { FilesetResolver, FaceLandmarker as FaceLandmarkerImpl, FaceLandmarkerOptions } from '@mediapipe/tasks-vision'

const FaceLandmarkerContext = createContext({} as FaceLandmarkerImpl | undefined)

type FaceLandmarkerProps = {
  basePath?: string
  options?: FaceLandmarkerOptions
  children?: ReactNode
}

export const FaceLandmarkerDefaults = {
  basePath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm',
  options: {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  } as FaceLandmarkerOptions,
}

export function FaceLandmarker({
  basePath = FaceLandmarkerDefaults.basePath,
  options = FaceLandmarkerDefaults.options,
  children,
}: FaceLandmarkerProps) {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarkerImpl>()
  useEffect(() => {
    let ret: FaceLandmarkerImpl

    FilesetResolver.forVisionTasks(basePath)
      .then((vision) => FaceLandmarkerImpl.createFromOptions(vision, options))
      .then((faceLandmarker) => setFaceLandmarker(faceLandmarker))
      .catch((err) => console.error('error while creating faceLandmarker', err))

    return () => void ret?.close()
  }, [basePath, options])

  return <FaceLandmarkerContext.Provider value={faceLandmarker}>{children}</FaceLandmarkerContext.Provider>
}

export function useFaceLandmarker() {
  return useContext(FaceLandmarkerContext)
}
