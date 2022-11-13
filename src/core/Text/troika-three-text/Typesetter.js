/**
 * Factory function that creates a self-contained environment for processing text typesetting requests.
 *
 * It is important that this function has no closure dependencies, so that it can be easily injected
 * into the source for a Worker without requiring a build step or complex dependency loading. All its
 * dependencies must be passed in at initialization.
 *
 * @param {function} fontParser - a function that accepts an ArrayBuffer of the font data and returns
 * a standardized structure giving access to the font and its glyphs:
 *   {
 *     unitsPerEm: number,
 *     ascender: number,
 *     descender: number,
 *     capHeight: number,
 *     xHeight: number,
 *     lineGap: number,
 *     forEachGlyph(string, fontSize, letterSpacing, callback) {
 *       //invokes callback for each glyph to render, passing it an object:
 *       callback({
 *         index: number,
 *         advanceWidth: number,
 *         xMin: number,
 *         yMin: number,
 *         xMax: number,
 *         yMax: number,
 *         path: string,
 *         pathCommandCount: number
 *       })
 *     }
 *   }
 * @param {object} bidi - the bidi.js implementation object
 * @param {Object} config
 * @return {Object}
 */
export function createTypesetter(fontParser, bidi, config) {
  const { defaultFontURL } = config

  /**
   * Holds parsed font objects by url
   */
  const fonts = Object.create(null)

  const INF = Infinity

  // Set of Unicode Default_Ignorable_Code_Point characters, these will not produce visible glyphs
  const DEFAULT_IGNORABLE_CHARS =
    /[\u00AD\u034F\u061C\u115F-\u1160\u17B4-\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8]/

  // Incomplete set of characters that allow line breaking after them
  // In the future we may consider a full Unicode line breaking algorithm impl: https://www.unicode.org/reports/tr14
  const BREAK_AFTER_CHARS = /[\s\-\u007C\u00AD\u2010\u2012-\u2014\u2027\u2056\u2E17\u2E40]/

  /**
   * Load a given font url
   */
  function doLoadFont(url, callback) {
    function tryLoad() {
      const onError = (err) => {
        console.error(`Failure loading font ${url}${url === defaultFontURL ? '' : '; trying fallback'}`, err)
        if (url !== defaultFontURL) {
          url = defaultFontURL
          tryLoad()
        }
      }
      try {
        const request = new XMLHttpRequest()
        request.open('get', url, true)
        request.responseType = 'arraybuffer'
        request.onload = function () {
          if (request.status >= 400) {
            onError(new Error(request.statusText))
          } else if (request.status > 0) {
            try {
              const fontObj = fontParser(request.response)
              callback(fontObj)
            } catch (e) {
              onError(e)
            }
          }
        }
        request.onerror = onError
        request.send()
      } catch (err) {
        onError(err)
      }
    }
    tryLoad()
  }

  /**
   * Load a given font url if needed, invoking a callback when it's loaded. If already
   * loaded, the callback will be called synchronously.
   */
  function loadFont(fontUrl, callback) {
    if (!fontUrl) fontUrl = defaultFontURL
    const font = fonts[fontUrl]
    if (font) {
      // if currently loading font, add to callbacks, otherwise execute immediately
      if (font.pending) {
        font.pending.push(callback)
      } else {
        callback(font)
      }
    } else {
      fonts[fontUrl] = { pending: [callback] }
      doLoadFont(fontUrl, (fontObj) => {
        const callbacks = fonts[fontUrl].pending
        fonts[fontUrl] = fontObj
        callbacks.forEach((cb) => cb(fontObj))
      })
    }
  }

  /**
   * Main entry point.
   * Process a text string with given font and formatting parameters, and return all info
   * necessary to render all its glyphs.
   */
  function typeset(
    {
      text = '',
      font = defaultFontURL,
      fontSize = 1,
      letterSpacing = 0,
      lineHeight = 'normal',
      maxWidth = INF,
      direction,
      textAlign = 'left',
      textIndent = 0,
      whiteSpace = 'normal',
      overflowWrap = 'normal',
      anchorX = 0,
      anchorY = 0,
      includeCaretPositions = false,
      chunkedBoundsSize = 8192,
      colorRanges = null,
    },
    callback,
    metricsOnly = false
  ) {
    const mainStart = now()
    const timings = { fontLoad: 0, typesetting: 0 }

    // Ensure newlines are normalized
    if (text.indexOf('\r') > -1) {
      console.info('Typesetter: got text with \\r chars; normalizing to \\n')
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    }

    // Ensure we've got numbers not strings
    fontSize = +fontSize
    letterSpacing = +letterSpacing
    maxWidth = +maxWidth
    lineHeight = lineHeight || 'normal'
    textIndent = +textIndent

    loadFont(font, (fontObj) => {
      const hasMaxWidth = isFinite(maxWidth)
      let glyphIds = null
      let glyphPositions = null
      let glyphData = null
      let glyphColors = null
      let caretPositions = null
      let visibleBounds = null
      let chunkedBounds = null
      let maxLineWidth = 0
      let renderableGlyphCount = 0
      const canWrap = whiteSpace !== 'nowrap'
      const { ascender, descender, unitsPerEm, lineGap, capHeight, xHeight } = fontObj
      timings.fontLoad = now() - mainStart
      const typesetStart = now()

      // Find conversion between native font units and fontSize units; this will already be done
      // for the gx/gy values below but everything else we'll need to convert
      const fontSizeMult = fontSize / unitsPerEm

      // Determine appropriate value for 'normal' line height based on the font's actual metrics
      // TODO this does not guarantee individual glyphs won't exceed the line height, e.g. Roboto; should we use yMin/Max instead?
      if (lineHeight === 'normal') {
        lineHeight = (ascender - descender + lineGap) / unitsPerEm
      }

      // Determine line height and leading adjustments
      lineHeight = lineHeight * fontSize
      const halfLeading = (lineHeight - (ascender - descender) * fontSizeMult) / 2
      const topBaseline = -(ascender * fontSizeMult + halfLeading)
      const caretHeight = Math.min(lineHeight, (ascender - descender) * fontSizeMult)
      const caretBottomOffset = ((ascender + descender) / 2) * fontSizeMult - caretHeight / 2

      // Distribute glyphs into lines based on wrapping
      let lineXOffset = textIndent
      let currentLine = new TextLine()
      const lines = [currentLine]

      fontObj.forEachGlyph(text, fontSize, letterSpacing, (glyphObj, glyphX, charIndex) => {
        const char = text.charAt(charIndex)
        const glyphWidth = glyphObj.advanceWidth * fontSizeMult
        const curLineCount = currentLine.count
        let nextLine

        // Calc isWhitespace and isEmpty once per glyphObj
        if (!('isEmpty' in glyphObj)) {
          glyphObj.isWhitespace = !!char && /\s/.test(char)
          glyphObj.canBreakAfter = !!char && BREAK_AFTER_CHARS.test(char)
          glyphObj.isEmpty =
            glyphObj.xMin === glyphObj.xMax || glyphObj.yMin === glyphObj.yMax || DEFAULT_IGNORABLE_CHARS.test(char)
        }
        if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
          renderableGlyphCount++
        }

        // If a non-whitespace character overflows the max width, we need to soft-wrap
        if (
          canWrap &&
          hasMaxWidth &&
          !glyphObj.isWhitespace &&
          glyphX + glyphWidth + lineXOffset > maxWidth &&
          curLineCount
        ) {
          // If it's the first char after a whitespace, start a new line
          if (currentLine.glyphAt(curLineCount - 1).glyphObj.canBreakAfter) {
            nextLine = new TextLine()
            lineXOffset = -glyphX
          } else {
            // Back up looking for a whitespace character to wrap at
            for (let i = curLineCount; i--; ) {
              // If we got the start of the line there's no soft break point; make hard break if overflowWrap='break-word'
              if (i === 0 && overflowWrap === 'break-word') {
                nextLine = new TextLine()
                lineXOffset = -glyphX
                break
              }
              // Found a soft break point; move all chars since it to a new line
              else if (currentLine.glyphAt(i).glyphObj.canBreakAfter) {
                nextLine = currentLine.splitAt(i + 1)
                const adjustX = nextLine.glyphAt(0).x
                lineXOffset -= adjustX
                for (let j = nextLine.count; j--; ) {
                  nextLine.glyphAt(j).x -= adjustX
                }
                break
              }
            }
          }
          if (nextLine) {
            currentLine.isSoftWrapped = true
            currentLine = nextLine
            lines.push(currentLine)
            maxLineWidth = maxWidth //after soft wrapping use maxWidth as calculated width
          }
        }

        const fly = currentLine.glyphAt(currentLine.count)
        fly.glyphObj = glyphObj
        fly.x = glyphX + lineXOffset
        fly.width = glyphWidth
        fly.charIndex = charIndex

        // Handle hard line breaks
        if (char === '\n') {
          currentLine = new TextLine()
          lines.push(currentLine)
          lineXOffset = -(glyphX + glyphWidth + letterSpacing * fontSize) + textIndent
        }
      })

      // Calculate width of each line (excluding trailing whitespace) and maximum block width
      lines.forEach((line) => {
        for (let i = line.count; i--; ) {
          const { glyphObj, x, width } = line.glyphAt(i)
          if (!glyphObj.isWhitespace) {
            line.width = x + width
            if (line.width > maxLineWidth) {
              maxLineWidth = line.width
            }
            return
          }
        }
      })

      // Find overall position adjustments for anchoring
      let anchorXOffset = 0
      let anchorYOffset = 0
      if (anchorX) {
        if (typeof anchorX === 'number') {
          anchorXOffset = -anchorX
        } else if (typeof anchorX === 'string') {
          anchorXOffset =
            -maxLineWidth *
            (anchorX === 'left' ? 0 : anchorX === 'center' ? 0.5 : anchorX === 'right' ? 1 : parsePercent(anchorX))
        }
      }
      if (anchorY) {
        if (typeof anchorY === 'number') {
          anchorYOffset = -anchorY
        } else if (typeof anchorY === 'string') {
          const height = lines.length * lineHeight
          anchorYOffset =
            anchorY === 'top'
              ? 0
              : anchorY === 'top-baseline'
              ? -topBaseline
              : anchorY === 'top-cap'
              ? -topBaseline - capHeight * fontSizeMult
              : anchorY === 'top-ex'
              ? -topBaseline - xHeight * fontSizeMult
              : anchorY === 'middle'
              ? height / 2
              : anchorY === 'bottom'
              ? height
              : anchorY === 'bottom-baseline'
              ? height - halfLeading + descender * fontSizeMult
              : parsePercent(anchorY) * height
        }
      }

      if (!metricsOnly) {
        // Resolve bidi levels
        const bidiLevelsResult = bidi.getEmbeddingLevels(text, direction)

        // Process each line, applying alignment offsets, adding each glyph to the atlas, and
        // collecting all renderable glyphs into a single collection.
        glyphIds = new Uint16Array(renderableGlyphCount)
        glyphPositions = new Float32Array(renderableGlyphCount * 2)
        glyphData = {}
        visibleBounds = [INF, INF, -INF, -INF]
        chunkedBounds = []
        let lineYOffset = topBaseline
        if (includeCaretPositions) {
          caretPositions = new Float32Array(text.length * 3)
        }
        if (colorRanges) {
          glyphColors = new Uint8Array(renderableGlyphCount * 3)
        }
        let renderableGlyphIndex = 0
        let prevCharIndex = -1
        let colorCharIndex = -1
        let chunk
        let currentColor
        lines.forEach((line) => {
          const { count: lineGlyphCount, width: lineWidth } = line

          // Ignore empty lines
          if (lineGlyphCount > 0) {
            // Count trailing whitespaces, we want to ignore these for certain things
            let trailingWhitespaceCount = 0
            for (let i = lineGlyphCount; i-- && line.glyphAt(i).glyphObj.isWhitespace; ) {
              trailingWhitespaceCount++
            }

            // Apply horizontal alignment adjustments
            let lineXOffset = 0
            let justifyAdjust = 0
            if (textAlign === 'center') {
              lineXOffset = (maxLineWidth - lineWidth) / 2
            } else if (textAlign === 'right') {
              lineXOffset = maxLineWidth - lineWidth
            } else if (textAlign === 'justify' && line.isSoftWrapped) {
              // count non-trailing whitespace characters, and we'll adjust the offsets per character in the next loop
              let whitespaceCount = 0
              for (let i = lineGlyphCount - trailingWhitespaceCount; i--; ) {
                if (line.glyphAt(i).glyphObj.isWhitespace) {
                  whitespaceCount++
                }
              }
              justifyAdjust = (maxLineWidth - lineWidth) / whitespaceCount
            }
            if (justifyAdjust || lineXOffset) {
              let justifyOffset = 0
              for (let i = 0; i < lineGlyphCount; i++) {
                const glyphInfo = line.glyphAt(i)
                const glyphObj = glyphInfo.glyphObj
                glyphInfo.x += lineXOffset + justifyOffset
                // Expand non-trailing whitespaces for justify alignment
                if (justifyAdjust !== 0 && glyphObj.isWhitespace && i < lineGlyphCount - trailingWhitespaceCount) {
                  justifyOffset += justifyAdjust
                  glyphInfo.width += justifyAdjust
                }
              }
            }

            // Perform bidi range flipping
            const flips = bidi.getReorderSegments(
              text,
              bidiLevelsResult,
              line.glyphAt(0).charIndex,
              line.glyphAt(line.count - 1).charIndex
            )
            for (let fi = 0; fi < flips.length; fi++) {
              const [start, end] = flips[fi]
              // Map start/end string indices to indices in the line
              let left = Infinity,
                right = -Infinity
              for (let i = 0; i < lineGlyphCount; i++) {
                if (line.glyphAt(i).charIndex >= start) {
                  // gte to handle removed characters
                  const startInLine = i
                  let endInLine = i
                  for (; endInLine < lineGlyphCount; endInLine++) {
                    const info = line.glyphAt(endInLine)
                    if (info.charIndex > end) {
                      break
                    }
                    if (endInLine < lineGlyphCount - trailingWhitespaceCount) {
                      //don't include trailing ws in flip width
                      left = Math.min(left, info.x)
                      right = Math.max(right, info.x + info.width)
                    }
                  }
                  for (let j = startInLine; j < endInLine; j++) {
                    const glyphInfo = line.glyphAt(j)
                    glyphInfo.x = right - (glyphInfo.x + glyphInfo.width - left)
                  }
                  break
                }
              }
            }

            // Assemble final data arrays
            let glyphObj
            const setGlyphObj = (g) => (glyphObj = g)
            for (let i = 0; i < lineGlyphCount; i++) {
              const glyphInfo = line.glyphAt(i)
              glyphObj = glyphInfo.glyphObj
              const glyphId = glyphObj.index

              // Replace mirrored characters in rtl
              const rtl = bidiLevelsResult.levels[glyphInfo.charIndex] & 1 //odd level means rtl
              if (rtl) {
                const mirrored = bidi.getMirroredCharacter(text[glyphInfo.charIndex])
                if (mirrored) {
                  fontObj.forEachGlyph(mirrored, 0, 0, setGlyphObj)
                }
              }

              // Add caret positions
              if (includeCaretPositions) {
                const { charIndex } = glyphInfo
                const caretLeft = glyphInfo.x + anchorXOffset
                const caretRight = glyphInfo.x + glyphInfo.width + anchorXOffset
                caretPositions[charIndex * 3] = rtl ? caretRight : caretLeft //start edge x
                caretPositions[charIndex * 3 + 1] = rtl ? caretLeft : caretRight //end edge x
                caretPositions[charIndex * 3 + 2] = lineYOffset + caretBottomOffset + anchorYOffset //common bottom y

                // If we skipped any chars from the previous glyph (due to ligature subs), fill in caret
                // positions for those missing char indices; currently this uses a best-guess by dividing
                // the ligature's width evenly. In the future we may try to use the font's LigatureCaretList
                // table to get better interior caret positions.
                const ligCount = charIndex - prevCharIndex
                if (ligCount > 1) {
                  fillLigatureCaretPositions(caretPositions, prevCharIndex, ligCount)
                }
                prevCharIndex = charIndex
              }

              // Track current color range
              if (colorRanges) {
                const { charIndex } = glyphInfo
                while (charIndex > colorCharIndex) {
                  colorCharIndex++
                  if (colorRanges.hasOwnProperty(colorCharIndex)) {
                    currentColor = colorRanges[colorCharIndex]
                  }
                }
              }

              // Get atlas data for renderable glyphs
              if (!glyphObj.isWhitespace && !glyphObj.isEmpty) {
                const idx = renderableGlyphIndex++

                // Add this glyph's path data
                if (!glyphData[glyphId]) {
                  glyphData[glyphId] = {
                    path: glyphObj.path,
                    pathBounds: [glyphObj.xMin, glyphObj.yMin, glyphObj.xMax, glyphObj.yMax],
                  }
                }

                // Determine final glyph position and add to glyphPositions array
                const glyphX = glyphInfo.x + anchorXOffset
                const glyphY = lineYOffset + anchorYOffset
                glyphPositions[idx * 2] = glyphX
                glyphPositions[idx * 2 + 1] = glyphY

                // Track total visible bounds
                const visX0 = glyphX + glyphObj.xMin * fontSizeMult
                const visY0 = glyphY + glyphObj.yMin * fontSizeMult
                const visX1 = glyphX + glyphObj.xMax * fontSizeMult
                const visY1 = glyphY + glyphObj.yMax * fontSizeMult
                if (visX0 < visibleBounds[0]) visibleBounds[0] = visX0
                if (visY0 < visibleBounds[1]) visibleBounds[1] = visY0
                if (visX1 > visibleBounds[2]) visibleBounds[2] = visX1
                if (visY1 > visibleBounds[3]) visibleBounds[3] = visY1

                // Track bounding rects for each chunk of N glyphs
                if (idx % chunkedBoundsSize === 0) {
                  chunk = { start: idx, end: idx, rect: [INF, INF, -INF, -INF] }
                  chunkedBounds.push(chunk)
                }
                chunk.end++
                const chunkRect = chunk.rect
                if (visX0 < chunkRect[0]) chunkRect[0] = visX0
                if (visY0 < chunkRect[1]) chunkRect[1] = visY0
                if (visX1 > chunkRect[2]) chunkRect[2] = visX1
                if (visY1 > chunkRect[3]) chunkRect[3] = visY1

                // Add to glyph ids array
                glyphIds[idx] = glyphId

                // Add colors
                if (colorRanges) {
                  const start = idx * 3
                  glyphColors[start] = (currentColor >> 16) & 255
                  glyphColors[start + 1] = (currentColor >> 8) & 255
                  glyphColors[start + 2] = currentColor & 255
                }
              }
            }
          }

          // Increment y offset for next line
          lineYOffset -= lineHeight
        })

        // Fill in remaining caret positions in case the final character was a ligature
        if (caretPositions) {
          const ligCount = text.length - prevCharIndex
          if (ligCount > 1) {
            fillLigatureCaretPositions(caretPositions, prevCharIndex, ligCount)
          }
        }
      }

      // Timing stats
      timings.typesetting = now() - typesetStart

      callback({
        glyphIds, //font indices for each glyph
        glyphPositions, //x,y of each glyph's origin in layout
        glyphData, //dict holding data about each glyph appearing in the text
        caretPositions, //startX,endX,bottomY caret positions for each char
        caretHeight, //height of cursor from bottom to top
        glyphColors, //color for each glyph, if color ranges supplied
        chunkedBounds, //total rects per (n=chunkedBoundsSize) consecutive glyphs
        fontSize, //calculated em height
        unitsPerEm, //font units per em
        ascender: ascender * fontSizeMult, //font ascender
        descender: descender * fontSizeMult, //font descender
        capHeight: capHeight * fontSizeMult, //font cap-height
        xHeight: xHeight * fontSizeMult, //font x-height
        lineHeight, //computed line height
        topBaseline, //y coordinate of the top line's baseline
        blockBounds: [
          //bounds for the whole block of text, including vertical padding for lineHeight
          anchorXOffset,
          anchorYOffset - lines.length * lineHeight,
          anchorXOffset + maxLineWidth,
          anchorYOffset,
        ],
        visibleBounds, //total bounds of visible text paths, may be larger or smaller than blockBounds
        timings,
      })
    })
  }

  /**
   * For a given text string and font parameters, determine the resulting block dimensions
   * after wrapping for the given maxWidth.
   * @param args
   * @param callback
   */
  function measure(args, callback) {
    typeset(
      args,
      (result) => {
        const [x0, y0, x1, y1] = result.blockBounds
        callback({
          width: x1 - x0,
          height: y1 - y0,
        })
      },
      { metricsOnly: true }
    )
  }

  function parsePercent(str) {
    const match = str.match(/^([\d.]+)%$/)
    const pct = match ? parseFloat(match[1]) : NaN
    return isNaN(pct) ? 0 : pct / 100
  }

  function fillLigatureCaretPositions(caretPositions, ligStartIndex, ligCount) {
    const ligStartX = caretPositions[ligStartIndex * 3]
    const ligEndX = caretPositions[ligStartIndex * 3 + 1]
    const ligY = caretPositions[ligStartIndex * 3 + 2]
    const guessedAdvanceX = (ligEndX - ligStartX) / ligCount
    for (let i = 0; i < ligCount; i++) {
      const startIndex = (ligStartIndex + i) * 3
      caretPositions[startIndex] = ligStartX + guessedAdvanceX * i
      caretPositions[startIndex + 1] = ligStartX + guessedAdvanceX * (i + 1)
      caretPositions[startIndex + 2] = ligY
    }
  }

  function now() {
    return (self.performance || Date).now()
  }

  // Array-backed structure for a single line's glyphs data
  function TextLine() {
    this.data = []
  }
  const textLineProps = ['glyphObj', 'x', 'width', 'charIndex']
  TextLine.prototype = {
    width: 0,
    isSoftWrapped: false,
    get count() {
      return Math.ceil(this.data.length / textLineProps.length)
    },
    glyphAt(i) {
      const fly = TextLine.flyweight
      fly.data = this.data
      fly.index = i
      return fly
    },
    splitAt(i) {
      const newLine = new TextLine()
      newLine.data = this.data.splice(i * textLineProps.length)
      return newLine
    },
  }
  TextLine.flyweight = textLineProps.reduce(
    (obj, prop, i) => {
      Object.defineProperty(obj, prop, {
        get() {
          return this.data[this.index * textLineProps.length + i]
        },
        set(val) {
          this.data[this.index * textLineProps.length + i] = val
        },
      })
      return obj
    },
    { data: null, index: 0 }
  )

  return {
    typeset,
    measure,
    loadFont,
  }
}
