declare module '*.jpeg' {
  const value: string
  export default value
}

/** The platform alias set this Storybook build uses (`DREI_RENDERER`, see main.mts). */
declare const __DREI_RENDERER__: 'webgpu' | 'legacy'
