import * as React from 'react'

export function useCursor(hovered: boolean, onPointerOver = 'pointer', onPointerOut = 'auto') {
  React.useEffect(() => {
    if (hovered) {
      document.body.style.cursor = onPointerOver
      return () => void (document.body.style.cursor = onPointerOut)
    }
  }, [hovered])
}
