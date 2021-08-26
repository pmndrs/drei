import * as React from 'react';
import { Object3DNode, useFrame, useThree } from '@react-three/fiber';
import { FirstPersonControls as FirstPersonControlImpl } from 'three-stdlib';

export type FirstPersonControlsProps = Object3DNode<FirstPersonControlImpl, typeof FirstPersonControlImpl>;

export const FirstPersonControls = React.forwardRef<FirstPersonControlImpl, FirstPersonControlsProps>((props, ref) => {
    const camera = useThree(({ camera }) => camera);
    const gl = useThree(({ gl }) => gl);
    const [controls] = React.useState(() => new FirstPersonControlImpl(camera, gl.domElement));

    useFrame((_, delta) => {
        controls.update(delta)
    });

    return controls ? <primitive ref={ref} object={controls} {...props} /> : null;
});
