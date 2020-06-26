import { useState, useEffect } from 'react'
import { useFrame } from 'react-three-fiber'
// @ts-ignore
import StatsImpl from 'stats.js'

type Props = {
  showPanel?: number
  className?: string
  domElement?: Node
}

export function Stats({ showPanel = 0, className, domElement }: Props): null {
  const [stats] = useState(() => new (StatsImpl as any)())
  useEffect(() => {
    stats.showPanel(showPanel)
    const elem = domElement || document.body
    elem.appendChild(stats.dom)
    if (className) stats.dom.classList.add(className)
    return () => elem.removeChild(stats.dom)
  }, [])
  return useFrame((state) => {
    stats.begin()
    state.gl.render(state.scene, state.camera)
    stats.end()
  }, 1)
}
