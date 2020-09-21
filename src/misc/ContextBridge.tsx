import React from 'react'

export function ContextBridge({
  contexts = [],
  children = null,
}: {
  contexts?: Array<{ context: React.Context<any>; value }>
  children?: React.ReactNode
}) {
  const reversed = React.useMemo(() => contexts.reverse(), [contexts])
  return reversed.reduce(
    (acc, { context: Context, value }) => <Context.Provider value={value}>{acc}</Context.Provider>,
    children
  )
}
