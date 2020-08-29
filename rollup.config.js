import path from 'path'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import json from 'rollup-plugin-json'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'
import glslify from 'rollup-plugin-glslify'

const root = process.platform === 'win32' ? path.resolve('/') : '/'
const external = (id) => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json']

const getBabelOptions = ({ useESModules }, targets) => ({
  babelrc: false,
  extensions,
  exclude: '**/node_modules/**',
  runtimeHelpers: true,
  presets: [
    ['@babel/preset-env', { loose: true, modules: false, targets }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['transform-react-remove-prop-types', { removeImport: true }],
    ['@babel/transform-runtime', { regenerator: false, useESModules }],
  ],
})

const fs = require('fs')
const OUTDIR = './dist'

if (!fs.existsSync(OUTDIR)) {
  fs.mkdirSync(OUTDIR)
}

const ignore = ['shapes', 'index', 'macro', 'glsl', 'ts-utils']

const files = fs
  .readdirSync('./src/')
  .map((file) => {
    let x = file.split('.').slice(0, -1).join('')
    return x
  })
  .filter((x) => !ignore.includes(x))
  .filter((x) => x !== '')

files.forEach((filename) => {
  if (!fs.existsSync(`${OUTDIR}/${filename}`)) {
    fs.mkdirSync(`${OUTDIR}/${filename}`)
  }

  fs.writeFileSync(`${OUTDIR}/${filename}/index.js`, `export { ${filename} as default } from "./${filename}.js"`)
})

const esmPlugins = [
  json(),
  glslify(),
  babel(getBabelOptions({ useESModules: true }, '>1%, not dead, not ie 11, not op_mini all')),
  sizeSnapshot(),
  resolve({ extensions }),
]

const cjsPlugins = [
  json(),
  glslify(),
  babel(getBabelOptions({ useESModules: false })),
  sizeSnapshot(),
  resolve({ extensions }),
]

function makeEsmConfig(file) {
  return {
    input: `./src/${file}.tsx`,
    output: { file: `dist/${file}/${file}.js`, format: 'esm' },
    external,
    plugins: esmPlugins,
  }
}

function makeCjsConfig(file) {
  return {
    input: `./src/${file}.tsx`,
    output: { file: `dist/${file}/${file}.cjs.js`, format: 'cjs' },
    external,
    plugins: cjsPlugins,
  }
}

export default [
  ...files.map(makeEsmConfig),
  {
    input: `./src/macro/index.tsx`,
    output: { file: `${OUTDIR}/macro/index.js`, format: 'esm' },
    external,
    plugins: esmPlugins,
  },
  {
    input: `./src/index.tsx`,
    output: { file: `${OUTDIR}/index.js`, format: 'esm' },
    external,
    plugins: esmPlugins,
  },
  ...files.map(makeCjsConfig),
  {
    input: `./src/index.tsx`,
    output: { file: `${OUTDIR}/index.cjs.js`, format: 'cjs' },
    external,
    plugins: cjsPlugins,
  },
  {
    input: `./src/macro/index.tsx`,
    output: { file: `${OUTDIR}/macro/index.cjs.js`, format: 'cjs' },
    external,
    plugins: cjsPlugins,
  },
]
