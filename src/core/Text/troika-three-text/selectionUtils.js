//=== Utility functions for dealing with carets and selection ranges ===//

/**
 * @typedef {object} TextCaret
 * @property {number} x - x position of the caret
 * @property {number} y - y position of the caret's bottom
 * @property {number} height - height of the caret
 * @property {number} charIndex - the index in the original input string of this caret's target
 *   character; the caret will be for the position _before_ that character.
 */

/**
 * Given a local x/y coordinate in the text block plane, find the nearest caret position.
 * @param {TroikaTextRenderInfo} textRenderInfo - a result object from TextBuilder#getTextRenderInfo
 * @param {number} x
 * @param {number} y
 * @return {TextCaret | null}
 */
export function getCaretAtPoint(textRenderInfo, x, y) {
  let closestCaret = null
  const { caretHeight } = textRenderInfo
  const caretsByRow = groupCaretsByRow(textRenderInfo)

  // Find nearest row by y first
  let closestRowY = Infinity
  caretsByRow.forEach((carets, rowY) => {
    if (Math.abs(y - (rowY + caretHeight / 2)) < Math.abs(y - (closestRowY + caretHeight / 2))) {
      closestRowY = rowY
    }
  })

  // Then find closest caret by x within that row
  caretsByRow.get(closestRowY).forEach((caret) => {
    if (!closestCaret || Math.abs(x - caret.x) < Math.abs(x - closestCaret.x)) {
      closestCaret = caret
    }
  })
  return closestCaret
}

const _rectsCache = new WeakMap()

/**
 * Given start and end character indexes, return a list of rectangles covering all the
 * characters within that selection.
 * @param {TroikaTextRenderInfo} textRenderInfo
 * @param {number} start - index of the first char in the selection
 * @param {number} end - index of the first char after the selection
 * @return {Array<{left, top, right, bottom}> | null}
 */
export function getSelectionRects(textRenderInfo, start, end) {
  let rects
  if (textRenderInfo) {
    // Check cache - textRenderInfo is frozen so it's safe to cache based on it
    const prevResult = _rectsCache.get(textRenderInfo)
    if (prevResult && prevResult.start === start && prevResult.end === end) {
      return prevResult.rects
    }

    const { caretPositions, caretHeight } = textRenderInfo

    // Normalize
    if (end < start) {
      const s = start
      start = end
      end = s
    }
    start = Math.max(start, 0)
    end = Math.min(end, caretPositions.length + 1)

    // Build list of rects, expanding the current rect for all characters in a run and starting
    // a new rect whenever reaching a new line or a new bidi direction
    rects = []
    let currentRect = null
    for (let i = start; i < end; i++) {
      const x1 = caretPositions[i * 3]
      const x2 = caretPositions[i * 3 + 1]
      const left = Math.min(x1, x2)
      const right = Math.max(x1, x2)
      const bottom = caretPositions[i * 3 + 2]
      if (!currentRect || bottom !== currentRect.bottom || left > currentRect.right || right < currentRect.left) {
        currentRect = {
          left: Infinity,
          right: -Infinity,
          bottom: bottom,
          top: bottom + caretHeight,
        }
        rects.push(currentRect)
      }
      currentRect.left = Math.min(left, currentRect.left)
      currentRect.right = Math.max(right, currentRect.right)
    }

    // Merge any overlapping rects, e.g. those formed by adjacent bidi runs
    rects.sort((a, b) => b.bottom - a.bottom || a.left - b.left)
    for (let i = rects.length - 1; i-- > 0; ) {
      const rectA = rects[i]
      const rectB = rects[i + 1]
      if (rectA.bottom === rectB.bottom && rectA.left <= rectB.right && rectA.right >= rectB.left) {
        rectB.left = Math.min(rectB.left, rectA.left)
        rectB.right = Math.max(rectB.right, rectA.right)
        rects.splice(i, 1)
      }
    }

    _rectsCache.set(textRenderInfo, { start, end, rects })
  }
  return rects
}

const _caretsByRowCache = new WeakMap()

function groupCaretsByRow(textRenderInfo) {
  // textRenderInfo is frozen so it's safe to cache based on it
  let caretsByRow = _caretsByRowCache.get(textRenderInfo)
  if (!caretsByRow) {
    const { caretPositions, caretHeight } = textRenderInfo
    caretsByRow = new Map()
    for (let i = 0; i < caretPositions.length; i += 3) {
      const rowY = caretPositions[i + 2]
      let rowCarets = caretsByRow.get(rowY)
      if (!rowCarets) {
        caretsByRow.set(rowY, (rowCarets = []))
      }
      rowCarets.push({
        x: caretPositions[i],
        y: rowY,
        height: caretHeight,
        charIndex: i / 3,
      })
      // Add one more caret after the final char
      if (i + 3 >= caretPositions.length) {
        rowCarets.push({
          x: caretPositions[i + 1],
          y: rowY,
          height: caretHeight,
          charIndex: i / 3 + 1,
        })
      }
    }
  }
  _caretsByRowCache.set(textRenderInfo, caretsByRow)
  return caretsByRow
}
