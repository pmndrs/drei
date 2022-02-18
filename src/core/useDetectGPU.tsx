import { getGPUTier, GetGPUTier, TierResult } from 'detect-gpu'
import { suspend } from 'suspend-react'

export const useDetectGPU = (props?: GetGPUTier) => suspend(() => getGPUTier(props), ['useDetectGPU'])
