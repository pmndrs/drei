import * as React from 'react'
import { getGPUTier, GetGPUTier } from 'detect-gpu'
import { suspend } from 'suspend-react'

/**
 * Hook to detect GPU capabilities using detect-gpu library.
 * Suspends while detecting, returns tier info.
 */
export const useDetectGPU = (props?: GetGPUTier) => suspend(() => getGPUTier(props), ['useDetectGPU'])

export type DetectGPUProps = {
  children?: (result: ReturnType<typeof useDetectGPU>) => React.ReactNode
} & Parameters<typeof useDetectGPU>[0]

/**
 * Component wrapper for GPU detection. Passes tier info to children.
 *
 * @example
 * ```jsx
 * <DetectGPU>
 *   {({ tier }) => tier < 2 ? <LowQuality /> : <HighQuality />}
 * </DetectGPU>
 * ```
 */
export function DetectGPU({ children, ...options }: DetectGPUProps) {
  const result = useDetectGPU(options)

  return <>{children?.(result)}</>
}
