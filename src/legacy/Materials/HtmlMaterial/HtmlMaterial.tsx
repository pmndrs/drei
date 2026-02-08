import * as React from 'react'
import { useMemo } from 'react'
import { DoubleSide } from '#three'

export const HtmlMaterial = ({ transform }: { transform: boolean }) => {
  const shaders = useMemo(
    () => ({
      vertexShader: !transform
        ? /* glsl */ `
            /*
              This shader is from the THREE's SpriteMaterial.
              We need to turn the backing plane into a Sprite
              (make it always face the camera) if "transform"
              is false.
            */
            #include <common>

            void main() {
              vec2 center = vec2(0., 1.);
              float rotation = 0.0;

              // This is somewhat arbitrary, but it seems to work well
              // Need to figure out how to derive this dynamically if it even matters
              float size = 0.03;

              vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
              vec2 scale;
              scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
              scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

              bool isPerspective = isPerspectiveMatrix( projectionMatrix );
              if ( isPerspective ) scale *= - mvPosition.z;

              vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
              vec2 rotatedPosition;
              rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
              rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
              mvPosition.xy += rotatedPosition;

              gl_Position = projectionMatrix * mvPosition;
            }
        `
        : undefined,
      fragmentShader: /* glsl */ `
          void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          }
        `,
    }),
    [transform]
  )
  return (
    <shaderMaterial
      side={DoubleSide}
      vertexShader={shaders.vertexShader}
      fragmentShader={shaders.fragmentShader}
    />
  )
}
