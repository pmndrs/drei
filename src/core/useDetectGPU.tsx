import * as React from 'react'
import { getGPUTier, GetGPUTier, TierResult } from 'detect-gpu'

export function useDetectGPU(props?: GetGPUTier): TierResult | null {
  const [GPUTier, setGPUTier] = React.useState<TierResult | null>(null)

  React.useEffect(() => {
    getGPUTier(props).then((result) => setGPUTier(result))
  }, [props])

  return GPUTier
}
