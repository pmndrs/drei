import * as React from 'react'

import { Setup } from '../Setup'

import { Box, useKTX2 } from '../../src'

export default {
  title: 'Loaders/KTX2',
  component: useKTX2,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  // a convenience hook that uses useLoader and KTX2Loader
  const [compressed, compressed_etc] = useKTX2(['sample_uastc_zstd.ktx2', 'sample_etc1s.ktx2'])

  return (
    <>
      <Box position={[-2, 0, 0]}>
        <meshBasicMaterial map={compressed} />
      </Box>
      <Box position={[2, 0, 0]}>
        <meshBasicMaterial map={compressed_etc} />
      </Box>
    </>
  )
}

function UseKTX2Scene() {
  return (
    <React.Suspense fallback={null}>
      <TexturedMeshes />
    </React.Suspense>
  )
}

export const UseKTX2SceneSt = () => <UseKTX2Scene />
UseKTX2SceneSt.story = {
  name: 'Default',
}
