import * as React from 'react'
import * as THREE from 'three'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Html, HtmlTexture, Plane, useHtmlTexture } from '../../src'
import type { HtmlTextureStatus } from '../../src'

export default {
  title: 'Misc/HtmlTexture',
  component: HtmlTexture,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 4.5)} controls={false} lights={false} frameloop="demand">
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof HtmlTexture>

type Story = StoryObj<typeof HtmlTexture>

function HtmlTexturePanel({ revision }: { revision: number }) {
  return (
    <div
      style={{
        width: 512,
        height: 256,
        padding: 28,
        color: '#111827',
        background: '#f8fafc',
        border: '1px solid #d9dee8',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
        HTMLTexture prototype
      </div>
      <h2 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1 }}>Visual-only DOM texture</h2>
      <p style={{ margin: 0, maxWidth: 420, color: '#475569', fontSize: 17, lineHeight: 1.35 }}>
        React DOM is mounted under the canvas and passed to THREE.HTMLTexture.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 16px',
          marginTop: 22,
          paddingTop: 18,
          borderTop: '1px solid #d9dee8',
          fontSize: 14,
        }}
      >
        <span style={{ color: '#64748b', fontWeight: 700 }}>Revision</span>
        <strong>{revision.toString().padStart(2, '0')}</strong>
        <span style={{ color: '#64748b', fontWeight: 700 }}>Mode</span>
        <strong>Static panel</strong>
      </div>
    </div>
  )
}

function HtmlTextureScene(props: React.ComponentProps<typeof HtmlTexture>) {
  const [revision, setRevision] = React.useState(1)
  const [status, setStatus] = React.useState<HtmlTextureStatus>({
    state: 'unsupported',
    paintCount: 0,
    message: 'Waiting for canvas.',
  })
  const source = React.useMemo(() => <HtmlTexturePanel revision={revision} />, [revision])
  const texture = useHtmlTexture(source, {
    width: 512,
    height: 256,
    warnUnsupported: false,
    onStatusChange: setStatus,
    ...props,
  })

  return (
    <>
      <color attach="background" args={['#11151c']} />
      <Plane args={[3.6, 1.8]} rotation={[0.18, -0.38, 0]}>
        <meshBasicMaterial color={texture ? '#ffffff' : '#2b2f38'} map={texture} side={THREE.DoubleSide} />
      </Plane>
      <Html center position={[0, -1.45, 0]} style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onClick={() => setRevision((value) => value + 1)}
          style={{
            border: 0,
            borderRadius: 6,
            padding: '8px 14px',
            color: '#111827',
            background: '#facc15',
            fontWeight: 700,
          }}
        >
          Update DOM source
        </button>
      </Html>
      <Html center position={[0, -2, 0]}>
        <div
          style={{
            minWidth: 360,
            padding: 12,
            color: '#d1d5db',
            background: 'rgba(17, 24, 39, 0.92)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 6,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          <strong style={{ color: status.state === 'ready' ? '#86efac' : '#fca5a5' }}>{status.state}</strong>
          {' · '}
          paint events: {status.paintCount}
          <br />
          {status.message}
        </div>
      </Html>
    </>
  )
}

export const HtmlTextureSt = {
  render: (args) => <HtmlTextureScene {...args} />,
  name: 'Default',
} satisfies Story
