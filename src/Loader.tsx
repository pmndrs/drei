import * as React from 'react'
import { useProgress } from './useProgress'
import { a, useTransition } from '@react-spring/web'

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#171717',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  inner: {
    width: 100,
    height: 3,
    background: '#272727',
    textAlign: 'center',
  },
  bar: {
    height: 3,
    width: '100%',
    background: 'white',
    transformOrigin: 'left center',
  },
  data: {
    display: 'inline-block',
    position: 'relative',
    fontVariantNumeric: 'tabular-nums',
    marginTop: '0.8em',
    color: '#f0f0f0',
    fontSize: '0.6em',
    fontFamily: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Helvetica, Arial, Roboto, Ubuntu, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    whiteSpace: 'nowrap',
  },
}

interface LoaderOptions {
  containerStyles: any
  innerStyles: any
  barStyles: any
  dataStyles: any
  dataInterpolation: (p: number) => string
  initialState: (active: boolean) => boolean
}

export function Loader({
  containerStyles,
  innerStyles,
  barStyles,
  dataStyles,
  dataInterpolation = (p: number) => `Loading ${p.toFixed(2)}%`,
  initialState = (active: boolean) => active,
}: Partial<LoaderOptions>) {
  const { active, progress } = useProgress()
  const transition = useTransition(initialState(active), {
    from: { opacity: 1, progress: 0 },
    leave: { opacity: 0 },
    update: { progress: progress / 100 },
  })
  const innerStylesMemo = React.useMemo(
    function memo() {
      return { ...styles.inner, ...innerStyles }
    },
    [innerStyles]
  )

  const spanStylesMemo = React.useMemo(function memo() {
    return { ...styles.data, ...dataStyles }
  }, [])

  return transition(({ progress, opacity }, active) => {
    return (
      active && (
        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
        <a.div style={{ ...styles.container, opacity, ...containerStyles }}>
          <div>
            <div style={innerStylesMemo}>
              {/* eslint-disable-next-line react-perf/jsx-no-new-object-as-prop */}
              <a.div style={{ ...styles.bar, scaleX: progress, ...barStyles }}></a.div>
              <a.span style={spanStylesMemo}>{progress.to(dataInterpolation)}</a.span>
            </div>
          </div>
        </a.div>
      )
    )
  })
}
