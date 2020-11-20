/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react'

export function useContextBridge(...contexts: Array<React.Context<any>>) {
  const cRef = React.useRef<Array<React.Context<any>>>([])

  cRef.current = contexts.map((context) => React.useContext(context))

  return React.useMemo(
    () => ({ children }: { children: React.ReactElement<any> }) =>
      contexts.reduceRight((acc, Context, i) => <Context.Provider value={cRef.current[i]} children={acc} />, children),
    []
  )
}
