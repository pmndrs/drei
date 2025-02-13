import { FontLoader, TTFLoader } from 'three-stdlib'
import { suspend, preload, clear } from 'suspend-react'

export type Glyph = {
  _cachedOutline: string[]
  ha: number
  o: string
}

export type FontData = {
  boundingBox: {
    yMax: number
    yMin: number
  }
  familyName: string
  glyphs: {
    [k: string]: Glyph
  }
  resolution: number
  underlineThickness: number
}
type FontInput = string | FontData

let fontLoader: FontLoader | null = null
let ttfLoader: TTFLoader | null = null

function parseFontData(fontData: FontData) {
  if (!fontLoader) {
    fontLoader = new FontLoader()
  }
  return fontLoader.parse(fontData)
}

function parseTtfArrayBuffer(ttfData: ArrayBuffer) {
  if (!ttfLoader) {
    ttfLoader = new TTFLoader()
  }
  return ttfLoader.parse(ttfData) as FontData
}

async function loadFontData(font: FontInput, ttfLoader: boolean) {
  if (typeof font === 'string') {
    const res = await fetch(font)

    if (ttfLoader) {
      const arrayBuffer = await res.arrayBuffer()
      return parseTtfArrayBuffer(arrayBuffer)
    } else {
      return (await res.json()) as FontData
    }
  } else {
    return font
  }
}

async function loader(font: FontInput, ttfLoader: boolean) {
  const fontData = await loadFontData(font, ttfLoader)
  return parseFontData(fontData)
}

export function useFont(font: FontInput, ttfLoader: boolean = false) {
  return suspend(loader, [font, ttfLoader])
}

useFont.preload = (font: FontInput, ttfLoader: boolean = false) => preload(loader, [font, ttfLoader])
useFont.clear = (font: FontInput, ttfLoader: boolean = false) => clear([font, ttfLoader])
