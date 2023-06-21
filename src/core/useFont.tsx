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

let fontLoader: FontLoader | null = null

async function loader(font: string | FontData) {
  if (!fontLoader) fontLoader = new FontLoader()
  let data = typeof font === 'string' ? await (await fetch(font as string)).json() : font
  return fontLoader.parse(data as FontData)
}

export function useFont(font: string | FontData) {
  return suspend(loader, [font])
}

useFont.preload = (font: string | FontData) => preload(loader, [font])
useFont.clear = (font: string | FontData) => clear([font])
