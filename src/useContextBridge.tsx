/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { ReactElement, Context, useRef, useMemo } from 'react'

export function useContextBridge(...contexts: Array<React.Context<any>>) {
  const cRef = useRef<Array<Context<any>>>([])
  cRef.current = contexts.map((context) => React.useContext(context))
  return useMemo(
    () => ({ children }: { children: ReactElement<any> }) =>
      contexts.reduceRight((acc, Context, i) => <Context.Provider value={cRef.current[i]} children={acc} />, children),
    []
  )
}
