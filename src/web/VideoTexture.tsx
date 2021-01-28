import * as React from 'react'
import * as ReactDOM from 'react-dom'
import mergeRefs from 'react-merge-refs'

type VideoTextureProps = {
  attach: string
  src: string
  videoRef?: React.RefObject<HTMLVideoElement>
  // this type smells wrong
} & React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>

/**
 * This component will create an HTML Video Element and mount it in the DOM
 * When the video is ready to play, a THREE videoTexture is created
 * and attached to the parent material.
 *
 * Props are passed on the html video element.
 * Ref could be forwarded to allow access to the texture but it wasn't needed here
 */
export function VideoTexture({ src, attach, videoRef, ...videoProps }: VideoTextureProps) {
  const [ready, setReady] = React.useState<boolean>(false)
  const [el] = React.useState(() => document.createElement('div'))
  const localVideoRef = React.useRef<HTMLVideoElement>(null)

  const handleCanPlayThrough = React.useCallback(
    (e) => {
      setReady(true)
      console.log(localVideoRef)

      // bubble up the event
      const { onCanPlayThrough } = videoProps
      if (typeof onCanPlayThrough === 'function') {
        onCanPlayThrough(e)
      }
    },
    [videoProps]
  )

  /**
   * The video is rendered to DOM using a reactDOM "portal"
   * such that unmounting and events are easily delegated to react
   */
  React.useEffect(() => {
    ReactDOM.render(
      /**
       * The video element sets a flag to true when ready to be played through
       * We also add  `onLoadedMetadata handler to get video size
       * */
      <video ref={mergeRefs([videoRef, localVideoRef])} {...videoProps} onCanPlayThrough={handleCanPlayThrough}>
        <source src={src} type="video/mp4" />
      </video>,
      el
    )
  })

  return ready ? <videoTexture attach={attach} wrapS={undefined} args={[localVideoRef.current!]} /> : null
}
