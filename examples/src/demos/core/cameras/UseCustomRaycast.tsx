import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { OrbitControls, OrthographicCamera, useCustomRaycast } from '@react-three/drei/core'
import { Mesh, OrthographicCamera as OrthographicCameraImpl, Scene, Matrix4 } from 'three'

//* useCustomRaycast Demo ==============================
// NOTE: This hook is ONLY needed for MANUAL RENDERING (gl.render).
// Modern R3F portals have their own event systems - no need for this hook in most cases!

function ManualRenderScene() {
  const hudCameraRef = useRef<OrthographicCameraImpl>(null!)
  const cubeRef = useRef<Mesh>(null!)
  const [hover, setHover] = useState<number | null>(null)

  const gl = useThree((state) => state.gl)
  const mainScene = useThree((state) => state.scene)
  const mainCamera = useThree((state) => state.camera)

  //* Virtual Scene Setup --------------------------------
  // Create a separate scene that we'll manually render
  const virtualScene = useMemo(() => new Scene(), [])

  // CRITICAL: useCustomRaycast is REQUIRED here because we're manually rendering
  // Manual rendering bypasses R3F's event system, so we need to explicitly
  // tell the mesh which camera to use for raycasting
  const customRaycast = useCustomRaycast(hudCameraRef)

  const matrix = new Matrix4()

  //* Manual Rendering --------------------------------
  // We're calling gl.render() directly, which bypasses R3F's event system
  useFrame(() => {
    matrix.copy(mainCamera.matrix).invert()
    if (cubeRef.current) cubeRef.current.quaternion.setFromRotationMatrix(matrix)

    // Manual rendering - this is why we need useCustomRaycast!
    gl.autoClear = true
    gl.render(mainScene, mainCamera)

    gl.autoClear = false
    gl.clearDepth()
    gl.render(virtualScene, hudCameraRef.current)
  }, 1)

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <mesh position={[2, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>

      <gridHelper args={[10, 10]} />

      {/* Portal content that we manually render */}
      {createPortal(
        <>
          <OrthographicCamera ref={hudCameraRef} makeDefault={false} position={[0, 0, 100]} zoom={2} />

          {/* useCustomRaycast is REQUIRED here for events to work */}
          <mesh
            ref={cubeRef}
            raycast={customRaycast}
            onPointerMove={(e) => setHover(Math.floor((e.faceIndex ?? 0) / 2))}
            onPointerOut={() => setHover(null)}
            onClick={() => console.log('Clicked with manual render + custom raycast')}
            position={[50, -30, 0]}
          >
            <boxGeometry args={[20, 20, 20]} />
            {[...Array(6)].map((_, index) => (
              <meshLambertMaterial
                key={index}
                attach={`material-${index}`}
                color="hotpink"
                wireframe={hover !== index}
              />
            ))}
          </mesh>

          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
        </>,
        virtualScene
      )}
    </>
  )
}

//* Standard Scene (NO useCustomRaycast needed) ==============================
// This is normal R3F usage - no portals, no manual rendering, just regular meshes

function NormalScene() {
  const [hover, setHover] = useState(false)
  const [clicked, setClicked] = useState(false)

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Regular mesh in the main scene */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>

      {/* Another mesh with events - NO useCustomRaycast needed! */}
      <mesh
        position={[-2, 1, 0]}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onClick={() => {
          setClicked(!clicked)
          console.log('Clicked in normal scene - no custom raycast needed!')
        }}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={clicked ? 'green' : hover ? 'yellow' : 'orange'} />
      </mesh>

      <gridHelper args={[10, 10]} />
    </>
  )
}

export default function UseCustomRaycastDemo() {
  const [mode, setMode] = useState<'manual' | 'normal'>('manual')

  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>useCustomRaycast</h2>

        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setMode('manual')} style={{ marginRight: '0.5rem' }}>
            Manual Render (needs hook)
          </button>
          <button onClick={() => setMode('normal')}>Normal Portal (no hook needed)</button>
        </div>

        {mode === 'manual' ? (
          <div>
            <h3>Manual Rendering Example</h3>
            <p>
              <strong>When you need it:</strong> This uses <code>gl.render()</code> directly, bypassing R3F's event
              system. The <code>useCustomRaycast</code> hook is <strong>REQUIRED</strong> to make pointer events work.
            </p>
            <p>Pink cube in bottom-right uses manual rendering. Hover over faces to highlight them.</p>
          </div>
        ) : (
          <div>
            <h3>Normal R3F Example</h3>
            <p>
              <strong>When you DON'T need it:</strong> Standard R3F usage with regular meshes in the scene.{' '}
              <code>useCustomRaycast</code> is <strong>NOT NEEDED</strong> because R3F handles everything.
            </p>
            <p>
              Orange cube has pointer events. Hover to turn yellow, click to toggle green. Events just work with no
              special setup!
            </p>
          </div>
        )}

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
          <strong>TL;DR:</strong> In modern R3F, you almost never need this hook. Use it ONLY when doing manual
          rendering with <code>gl.render()</code>. For normal scenes, portals, and HUDs (using drei components like{' '}
          <code>Hud</code>), events work automatically!
        </div>
      </div>

      <div className="demo-canvas">
        <Canvas camera={{ position: [5, 5, 5] }}>{mode === 'manual' ? <ManualRenderScene /> : <NormalScene />}</Canvas>
      </div>
    </div>
  )
}
