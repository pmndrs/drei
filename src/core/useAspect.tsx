import { useThree } from '@react-three/fiber'

export function useAspect(width: number, height: number, factor: number = 1): [number, number, number] {
  const v = useThree((state) => state.viewport)
  const adaptedHeight = height * (v.aspect > width / height ? v.width / width : v.height / height)
  const adaptedWidth = width * (v.aspect > width / height ? v.width / width : v.height / height)
  return [adaptedWidth * factor, adaptedHeight * factor, 1]
}
