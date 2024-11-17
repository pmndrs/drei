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

async function loadFontData(font: FontInput) {
  if (typeof font === 'string') {
    const res = await fetch(font)

    if (res.headers.get('Content-Type')?.includes('application/json')) {
      return (await res.json()) as FontData
    } else {
      const arrayBuffer = await res.arrayBuffer()
      return parseTtfArrayBuffer(arrayBuffer)
    }
  } else {
    return font
  }
}

async function loader(font: FontInput) {
  const fontData = await loadFontData(font)
  return parseFontData(fontData)
}

export function useFont(font: FontInput) {
  return suspend(loader, [font])
}

useFont.preload = (font: FontInput) => preload(loader, [font])
useFont.clear = (font: FontInput) => clear([font])
