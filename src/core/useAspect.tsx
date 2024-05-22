import { useThree } from '@react-three/fiber'

export function useAspect(width: number, height: number, factor: number = 1): [number, number, number] {
  const size = useThree((state) => state.size)
  const aspect = size.width / size.height
  const adaptedHeight = height * (aspect > width / height ? size.width / width : size.height / height)
  const adaptedWidth = width * (aspect > width / height ? size.width / width : size.height / height)

  return [adaptedWidth * factor, adaptedHeight * factor, 1]
}
