import { useMemo } from 'react'
import { getGPUTier, IGetGPUTier } from 'detect-gpu'

export function useDetectGPU(
  props: IGetGPUTier
): {
  tier: string
  type: string
} {
  const GPUTier = useMemo(() => {
    return getGPUTier(props)
  }, [props])

  return GPUTier
}
