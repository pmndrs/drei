import { getGPUTier, GetGPUTier, TierResult } from 'detect-gpu'
import { useAsset } from 'use-asset'

export const useDetectGPU = (props?: GetGPUTier) =>
  useAsset<TierResult, [string]>(() => getGPUTier(props), 'useDetectGPU')
