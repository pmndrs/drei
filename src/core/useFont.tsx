import { FontLoader } from 'three-stdlib'
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

async function loadFontData(font: FontInput): Promise<FontData> {
  return typeof font === 'string' ? await (await fetch(font)).json() : font
}

function parseFontData(fontData: FontData) {
  if (!fontLoader) {
    fontLoader = new FontLoader()
  }
  return fontLoader.parse(fontData)
}

async function loader(font: FontInput) {
  const data = await loadFontData(font)
  return parseFontData(data)
}

export function useFont(font: FontInput) {
  return suspend(loader, [font])
}

useFont.preload = (font: FontInput) => preload(loader, [font])
useFont.clear = (font: FontInput) => clear([font])
