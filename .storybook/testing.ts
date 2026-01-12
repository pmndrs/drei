/**
 * Testing Environment Detection
 *
 * Provider-agnostic utility for detecting test environments.
 * This decouples our code from specific test runners (Chromatic, Playwright, Vitest, etc.)
 * so we can change providers without modifying components.
 */

//* Types ==============================

export type TestEnvironment = {
  /** True if running in any test environment */
  isTesting: boolean

  /** Specific test runner detection */
  isChromatic: boolean
  isPlaywright: boolean
  isVitest: boolean
  isCypress: boolean

  /** Behavioral flags - what should we do in this test env? */
  shouldFreezeAnimations: boolean
  shouldDisableTransitions: boolean
  shouldSkipDelays: boolean

  /** The detected test runner name, or null if not testing */
  runner: 'chromatic' | 'playwright' | 'vitest' | 'cypress' | null
}

//* Detection Logic ==============================

/**
 * Detects Chromatic environment
 * - Chromatic sets CHROMATIC=true in env
 * - Also injects into userAgent on their capture servers
 */
function detectChromatic(): boolean {
  // Server-side / build-time check
  if (typeof process !== 'undefined' && process.env?.CHROMATIC === 'true') return true

  // Client-side check (Chromatic's capture environment)
  if (typeof window !== 'undefined') {
    // Chromatic injects this into the window
    if ((window as any).navigator?.userAgent?.match(/Chromatic/i)) return true
    // Also check for the storybook chromatic addon marker
    if ((window as any).__STORYBOOK_ADDON_CHROMATIC__) return true
  }

  return false
}

/**
 * Detects Playwright environment
 * - Playwright can inject __PLAYWRIGHT__ into page context
 * - Or we check for the test runner env var
 */
function detectPlaywright(): boolean {
  if (typeof process !== 'undefined' && process.env?.PLAYWRIGHT === 'true') return true
  if (typeof window !== 'undefined' && (window as any).__playwright__) return true
  if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT__) return true
  return false
}

/**
 * Detects Vitest environment
 * - Vitest sets VITEST=true in env
 */
function detectVitest(): boolean {
  if (typeof process !== 'undefined' && process.env?.VITEST === 'true') return true
  // @ts-ignore - import.meta.vitest exists in vitest
  if (typeof import.meta !== 'undefined' && (import.meta as any).vitest) return true
  return false
}

/**
 * Detects Cypress environment
 * - Cypress injects window.Cypress
 */
function detectCypress(): boolean {
  if (typeof window !== 'undefined' && (window as any).Cypress) return true
  return false
}

//* Main API ==============================

/**
 * Get comprehensive test environment info
 *
 * @example
 * ```tsx
 * const env = getTestEnvironment();
 * if (env.shouldFreezeAnimations) {
 *   // Disable animations for visual testing
 * }
 * ```
 */
export function getTestEnvironment(): TestEnvironment {
  const isChromatic = detectChromatic()
  const isPlaywright = detectPlaywright()
  const isVitest = detectVitest()
  const isCypress = detectCypress()

  const isTesting = isChromatic || isPlaywright || isVitest || isCypress

  // Determine runner name
  let runner: TestEnvironment['runner'] = null
  if (isChromatic) runner = 'chromatic'
  else if (isPlaywright) runner = 'playwright'
  else if (isVitest) runner = 'vitest'
  else if (isCypress) runner = 'cypress'

  return {
    isTesting,
    isChromatic,
    isPlaywright,
    isVitest,
    isCypress,

    // Behavioral flags
    // Visual test runners need frozen animations for consistent snapshots
    shouldFreezeAnimations: isChromatic || isPlaywright,
    shouldDisableTransitions: isChromatic,
    shouldSkipDelays: isVitest, // Unit tests should be fast

    runner,
  }
}

/**
 * Simple boolean check for any test environment
 *
 * @example
 * ```tsx
 * if (isTesting()) {
 *   // We're in a test environment
 * }
 * ```
 */
export function isTesting(): boolean {
  return getTestEnvironment().isTesting
}

/**
 * Check if animations should be frozen (for visual testing)
 *
 * @example
 * ```tsx
 * <CameraShake intensity={shouldFreezeAnimations() ? 0 : 1} />
 * ```
 */
export function shouldFreezeAnimations(): boolean {
  return getTestEnvironment().shouldFreezeAnimations
}

//* React Hook ==============================

/**
 * React hook for test environment detection
 * Memoized to avoid recalculating on every render
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTesting, shouldFreezeAnimations } = useTestEnvironment();
 *   return <Animation paused={shouldFreezeAnimations} />;
 * }
 * ```
 */
export function useTestEnvironment(): TestEnvironment {
  // This is stable - test environment doesn't change during runtime
  // No need for useState/useEffect, just return the detection result
  return getTestEnvironment()
}
