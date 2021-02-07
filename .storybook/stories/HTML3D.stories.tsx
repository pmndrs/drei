import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'

import { Setup } from '../Setup'

import { Html3D, MixedCanvas } from '../../src'

export default {
  title: 'Misc/Html3D',
  component: Html3D,
  decorators: [
    (storyFn) => (
      <Setup CanvasComponent={MixedCanvas} cameraPosition={new THREE.Vector3(0, 0, 4)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function HTML3DScene() {
  const [toggle, setToggle] = React.useState(false)
  return (
    <>
      <Html3D position={[0, 0, -2]}>
        <div contentEditable suppressContentEditableWarning style={styles.base('crimson')}>
          Edit
          <br />
          me
        </div>
      </Html3D>
      <Html3D position={[-2, 0, -0.9]} rotation={[0, 1.1, 0]}>
        <div
          style={styles.animatable('aquamarine', ...(toggle ? ['600px', '300px'] : ['400px', '150px']))}
          onClick={() => setToggle((s) => !s)}
        >
          Click to
          <br />
          animate me
        </div>
      </Html3D>
      <Html3D position={[2, 0, -0.9]} rotation={[0, -1.1, 0]}>
        <div style={styles.resizable('orange')}>
          Resize me at
          <br />
          the bottom
          <br />
          right corner
        </div>
      </Html3D>
      <Html3D sprite position={[0, -1.6, -0.2]}>
        <div style={styles.base('#fe7f9c')}>I am a sprite</div>
      </Html3D>
      <mesh position={[0, 0, -2]} rotation={[0.5, 0, 0]}>
        <torusBufferGeometry args={[1, 0.08]} />
        <meshNormalMaterial />
      </mesh>
      <mesh position={[0, -0.1, -1.27]} rotation={[-3.14 / 6, 0, 0]}>
        <torusBufferGeometry args={[2.3, 0.08]} />
        <meshNormalMaterial />
      </mesh>
    </>
  )
}

const styles = {
  base(borderColor: string, width: string = 'auto', height: string = 'auto') {
    return {
      padding: '20px',
      border: '10px solid ' + borderColor,
      backgroundColor: '#fff',
      fontSize: '64px',
      fontFamily: 'Courier New',
      letterSpacing: '-5px',
      minWidth: '200px',
      width,
      height,
    }
  },
  resizable(...args: string[]) {
    return { resize: 'both', overflow: 'auto', ...this.base(...args) }
  },
  animatable(...args: string[]) {
    return { cursor: 'pointer', transition: 'width 0.5s, height 0.5s ease', ...this.base(...args) }
  },
}

export const HTML3DSt = () => <HTML3DScene />
HTML3DSt.storyName = 'Default'
