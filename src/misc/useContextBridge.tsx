import React from 'react'

export function useContextBridge(...contexts: Array<React.Context<any>>) {
  /* eslint-disable react-hooks/rules-of-hooks */
  const contextValues = contexts.map((context) => React.useContext(context))
  return React.useMemo(
    () => ({ children }: { children: React.ReactElement<any> }) =>
      contexts.reduceRight(
        (acc, Context, index) => <Context.Provider value={contextValues[index]} children={acc} />,
        children
      ),
    /* eslint-disable react-hooks/exhaustive-deps */
    [contexts]
  )
}
