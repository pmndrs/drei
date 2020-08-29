import { addDefault, addNamed } from '@babel/helper-module-imports'
import traverse from '@babel/traverse'
import { createMacro } from 'babel-plugin-macros'
import babelPlugin from 'babel-plugin-drei'

function dreiMacro({ references, state, babel: { types }, config = {} }) {
  const program = state.file.path

  // FIRST STEP : replace `drei/macro` by `drei`
  // references looks like this
  // { default: [path, path], css: [path], ... }
  let customImportName
  Object.keys(references).forEach((refName) => {
    // generate new identifier
    let id
    if (refName === 'default') {
      id = addDefault(program, 'drei', { nameHint: 'drei' })
      customImportName = id
    } else {
      id = addNamed(program, refName, 'drei', { nameHint: refName })
    }

    // update references with the new identifiers
    references[refName].forEach((referencePath) => {
      // eslint-disable-next-line no-param-reassign
      referencePath.node.name = id.name
    })
  })

  // SECOND STEP : apply babel-plugin-drei to the file
  const stateWithOpts = { ...state, opts: config, customImportName }
  traverse(program.parent, babelPlugin({ types }).visitor, undefined, stateWithOpts)
}

export default createMacro(dreiMacro)
