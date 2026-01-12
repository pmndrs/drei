/**
 * Story Variant Helpers
 *
 * Utilities for creating platform-specific story variants that are:
 * - Hidden from the Storybook UI (using tags)
 * - Visible to Chromatic for visual testing
 *
 * This allows us to test both Legacy (WebGL) and WebGPU renders
 * without cluttering the developer-facing story browser.
 */
import type { StoryObj } from '@storybook/react-vite'

//* Types ==============================

type Platform = 'legacy' | 'webgpu'

type BaseStory = StoryObj<any>

type VariantOptions = {
  /** Tags to add to the variant (in addition to hidden tags) */
  tags?: string[]
  /** Additional parameters to merge */
  parameters?: Record<string, any>
  /** Override the variant name suffix */
  nameSuffix?: string
}

//* Hidden Tags ==============================

/**
 * Tags that hide stories from the Storybook UI but keep them for Chromatic
 *
 * - `!dev` - Hide from development sidebar
 * - `!autodocs` - Hide from auto-generated docs
 * - `test` - Mark as a test story (Chromatic still picks it up)
 */
const HIDDEN_TAGS = ['!dev', '!autodocs', 'test'] as const

//* Variant Creators ==============================

/**
 * Creates a platform-specific variant of a story
 *
 * @param baseStory - The original story to create a variant from
 * @param platform - Which platform to force ('legacy' or 'webgpu')
 * @param options - Additional configuration
 * @returns A new story object configured for the specified platform
 *
 * @example
 * ```tsx
 * export const Default = {
 *   render: (args) => <Billboard {...args} />,
 * } satisfies Story;
 *
 * // Hidden variants for Chromatic cross-platform testing
 * export const DefaultLegacy = createPlatformVariant(Default, 'legacy');
 * export const DefaultWebGPU = createPlatformVariant(Default, 'webgpu');
 * ```
 */
export function createPlatformVariant<T extends BaseStory>(
  baseStory: T,
  platform: Platform,
  options: VariantOptions = {}
): T {
  const { tags = [], parameters = {}, nameSuffix } = options

  const platformTag = platform === 'legacy' ? 'legacyOnly' : 'webgpuOnly'
  const suffix = nameSuffix ?? (platform === 'legacy' ? ' (Legacy)' : ' (WebGPU)')

  return {
    ...baseStory,
    name: baseStory.name ? `${baseStory.name}${suffix}` : undefined,
    parameters: {
      ...baseStory.parameters,
      ...parameters,
      limitedTo: platform, // Forces Setup to use this renderer
      chromatic: {
        ...baseStory.parameters?.chromatic,
        ...parameters.chromatic,
      },
    },
    tags: [...HIDDEN_TAGS, platformTag, ...(baseStory.tags ?? []), ...tags],
  } as T
}

/**
 * Creates both Legacy and WebGPU variants of a story
 *
 * @param baseStory - The original story to create variants from
 * @param options - Configuration for both variants
 * @returns Object with `legacy` and `webgpu` story variants
 *
 * @example
 * ```tsx
 * export const Default = {
 *   render: (args) => <Billboard {...args} />,
 * } satisfies Story;
 *
 * const variants = createPlatformVariants(Default);
 * export const DefaultLegacy = variants.legacy;
 * export const DefaultWebGPU = variants.webgpu;
 * ```
 */
export function createPlatformVariants<T extends BaseStory>(
  baseStory: T,
  options: {
    legacy?: VariantOptions
    webgpu?: VariantOptions
  } = {}
): { legacy: T; webgpu: T } {
  return {
    legacy: createPlatformVariant(baseStory, 'legacy', options.legacy),
    webgpu: createPlatformVariant(baseStory, 'webgpu', options.webgpu),
  }
}

/**
 * Helper to add Chromatic-specific parameters to a story
 *
 * @example
 * ```tsx
 * export const LoadingStory = {
 *   render: () => <Environment preset="city" />,
 *   parameters: withChromaticParams({
 *     delay: 1000, // Wait for HDR to load
 *     diffThreshold: 0.2, // Allow slight differences
 *   }),
 * } satisfies Story;
 * ```
 */
export function withChromaticParams(chromaticOptions: {
  /** Delay in ms before taking snapshot (for loading states) */
  delay?: number
  /** Pixel diff threshold (0-1, default 0.063) */
  diffThreshold?: number
  /** Disable this story in Chromatic */
  disable?: boolean
  /** Pause CSS/JS animations at end */
  pauseAnimationAtEnd?: boolean
}): { chromatic: typeof chromaticOptions } {
  return { chromatic: chromaticOptions }
}

//* Batch Variant Generation ==============================

/**
 * Generates platform variants for multiple stories at once
 * Useful for stories files with many exports
 *
 * @example
 * ```tsx
 * // At the end of a stories file:
 * const {
 *   DefaultLegacy, DefaultWebGPU,
 *   WithPropsLegacy, WithPropsWebGPU
 * } = generatePlatformVariants({
 *   Default: DefaultStory,
 *   WithProps: WithPropsStory,
 * });
 *
 * export { DefaultLegacy, DefaultWebGPU, WithPropsLegacy, WithPropsWebGPU };
 * ```
 */
export function generatePlatformVariants<T extends Record<string, BaseStory>>(
  stories: T
): Record<`${Extract<keyof T, string>}Legacy` | `${Extract<keyof T, string>}WebGPU`, BaseStory> {
  const result: Record<string, BaseStory> = {}

  for (const [name, story] of Object.entries(stories)) {
    result[`${name}Legacy`] = createPlatformVariant(story, 'legacy')
    result[`${name}WebGPU`] = createPlatformVariant(story, 'webgpu')
  }

  return result as any
}
