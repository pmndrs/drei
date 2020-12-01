import { useEffect, useState } from 'react'
import { getGPUTier, GetGPUTier, TierResult } from 'detect-gpu'

export function useDetectGPU(props?: GetGPUTier): TierResult | null {
  const [GPUTier, setGPUTier] = useState<TierResult | null>(null)

  useEffect(() => {
    getGPUTier(props).then((result) => setGPUTier(result))
  }, [props])

  return GPUTier
}
