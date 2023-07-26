import * as React from 'react'

export function useCursor(hovered: boolean, onPointerOver = 'pointer', onPointerOut = 'auto', container: HTMLElement = document.body) {
  React.useEffect(() => {
    if (hovered) {
      container.style.cursor = onPointerOver
      return () => void (container.style.cursor = onPointerOut)
    }
  }, [hovered])
}
