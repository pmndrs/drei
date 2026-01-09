import * as React from 'react'
import { Euler, MathUtils, Mesh, ShaderMaterial, Vector3 } from 'three'
// import { StoryObj } from '@storybook/react-vite'
import { Setup } from '@sb/Setup'

import { useGLTF, Instances, Instance, createInstances, InstancedAttribute } from 'drei'
import { useFrame } from '@react-three/fiber'
import { clamp } from 'maath/misc'

export default {
  title: 'Performance/Instances',
  component: Instances,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
}

// type Story = StoryObj

// function Helmet() {

//   return <primitive object={nodes['node_damagedHelmet_-6514']} />
// }

export const InstancesSt = () => {
  const { nodes } = useGLTF('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf')

  const helmet = nodes['node_damagedHelmet_-6514'] as Mesh

  return (
    <Instances limit={1000} geometry={helmet.geometry} material={helmet.material}>
      {Array.from({ length: 1000 }, (_, i) => (
        <Instance
          key={i}
          position={[MathUtils.randFloatSpread(100), MathUtils.randFloatSpread(100), MathUtils.randFloatSpread(100)]}
          rotation={new Euler(Math.PI * Math.random(), Math.PI * Math.random(), Math.PI * Math.random())}
        />
      ))}
    </Instances>
  )
}

interface SuzaneInstnaceProps {
  reveal: number
}

const [SuzaneInstances, SuzaneInstnace] = createInstances<SuzaneInstnaceProps>()

const Suzanne = () => {
  const randomShift = React.useMemo(() => Math.random() * Math.PI, [])
  const [_isPending] = React.useTransition()

  const instancePosition = React.useMemo(
    () => [MathUtils.randFloatSpread(100), MathUtils.randFloatSpread(100), MathUtils.randFloatSpread(100)] as const,
    []
  )

  const instanceRotation = React.useMemo(() => new Euler(0, Math.PI * Math.random(), 0), [])

  const ref = React.useRef<React.ComponentRef<typeof SuzaneInstnace> | null>(null)

  useFrame(({ elapsed }) => {
    if (ref.current) {
      ref.current.reveal = clamp((Math.sin(randomShift + elapsed) * 0.5 + 0.5) * 2, 0, 1)
    }
  })

  return <SuzaneInstnace ref={ref} position={instancePosition} rotation={instanceRotation} reveal={0} />
}

export const CreateInstancesSt = () => {
  const { nodes } = useGLTF('suzanne.glb', true) as any

  const SuzanneMesh = nodes['Suzanne'] as Mesh

  const suzanneMaterial = React.useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        vertexShader: /*glsl*/ `
      attribute float reveal;
      varying float vReveal;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vReveal = reveal;
        vNormal = normal;
        vec4 modelPosition = instanceMatrix * modelMatrix * vec4(position, 1.0);
        vPosition = modelPosition.xyz;
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;
        gl_Position = projectionPosition;
      }
    `,
        fragmentShader: /*glsl*/ `
      varying float vReveal;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      float sdf(vec3 p) {
        return sin(p.x + uTime * 1.2) * cos(p.y) * sin(p.z);
      }

      void main() {
        float d = sdf(vPosition * 4.) * 0.5 + 0.5;

        float revealed = smoothstep(d-0.05, d, vReveal);

        float revealedAlpha = smoothstep(d-0.1, d - 0.05, revealed);

        vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
        float rawLambert = dot(vNormal, lightDirection);
        float lambert = clamp(rawLambert, 0.0, 1.0);

        vec3 result = mix(
          vec3(255, 77, 0)/255.0,
          vec3(lambert),
          revealed
        );

        if (revealedAlpha < 0.01) discard;


        gl_FragColor = vec4(result, revealedAlpha);

      }
    `,
      }),
    []
  )

  useFrame(({ elapsed }) => {
    suzanneMaterial.uniforms.uTime.value = elapsed
  })

  return (
    <SuzaneInstances limit={1000} geometry={SuzanneMesh.geometry} material={suzanneMaterial}>
      <InstancedAttribute name="reveal" defaultValue={1} />

      {Array.from({ length: 1000 }, (_, i) => (
        <Suzanne key={i} />
      ))}
    </SuzaneInstances>
  )
}
