// vite.config.js
import glslify from 'vite-plugin-glslify'
import replace from '@rollup/plugin-replace'
import { replacements } from './rollup.config'

export default {
  plugins: [replace(replacements), glslify()],
}
