import * as React from 'react'

/**
 * Sets the cursor style based on hover state.
 *
 * @example Basic usage
 * ```jsx
 * const [hovered, setHovered] = useState(false)
 * useCursor(hovered, 'pointer', 'auto')
 * return <mesh onPointerOver={() => setHovered(true)} />
 * ```
 */
export function useCursor(
  hovered: boolean,
  onPointerOver = 'pointer',
  onPointerOut = 'auto',
  container: HTMLElement = document.body
) {
  React.useEffect(() => {
    if (hovered) {
      container.style.cursor = onPointerOver
      return () => void (container.style.cursor = onPointerOut)
    }
  }, [hovered])
}
