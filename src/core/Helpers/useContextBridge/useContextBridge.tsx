/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react'

/**
 * Forwards contexts provided above the Canvas to be consumed within it.
 *
 * @example Basic usage
 * ```jsx
 * function SceneWrapper() {
 *   const ContextBridge = useContextBridge(ThemeContext, GreetingContext)
 *   return (
 *     <Canvas>
 *       <ContextBridge>
 *         <Scene />
 *       </ContextBridge>
 *     </Canvas>
 *   )
 * }
 * ```
 */
export function useContextBridge(...contexts: Array<React.Context<any>>) {
  const cRef = React.useRef<Array<React.Context<any>>>([])
  cRef.current = contexts.map((context) => React.useContext(context))
  return React.useMemo(
    () =>
      ({ children }: { children: React.ReactNode }): React.JSX.Element =>
        contexts.reduceRight(
          (acc, Context, i) => <Context.Provider value={cRef.current[i]} children={acc} />,
          children
          /*
           * done this way in reference to:
           * https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572#issuecomment-625878049
           * https://github.com/microsoft/TypeScript/issues/14729
           */
        ) as unknown as React.JSX.Element,
    []
  )
}
