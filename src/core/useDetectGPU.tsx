import * as React from 'react'
import { getGPUTier, GetGPUTier, TierResult } from 'detect-gpu'
import { useAsset } from 'use-asset'

export function useDetectGPU(props?: GetGPUTier): TierResult | null {
  const [GPUTier, setGPUTier] = React.useState<TierResult | null>(null)
  return useAsset<TierResult, [string]>(() => getGPUTier(props), 'useDetectGPU')
}
