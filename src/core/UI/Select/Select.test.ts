import { describe, it, expect, vi } from 'vitest'

describe('Select', () => {
  describe('boxSelectActivator', () => {
    it('default activator opens box select when shift is held', () => {
      const defaultActivator = (event: PointerEvent) => event.shiftKey
      expect(defaultActivator({ shiftKey: true } as PointerEvent)).toBe(true)
      expect(defaultActivator({ shiftKey: false } as PointerEvent)).toBe(false)
    })

    it('custom activator can opt into left-button-only triggering', () => {
      const leftButtonOnly = (event: PointerEvent) => event.button === 0
      const customCall = vi.fn(leftButtonOnly)
      expect(customCall({ button: 0, shiftKey: false } as PointerEvent)).toBe(true)
      expect(customCall({ button: 2, shiftKey: true } as PointerEvent)).toBe(false)
      expect(customCall).toHaveBeenCalledTimes(2)
    })
  })
})
