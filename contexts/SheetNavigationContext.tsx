'use client'

import * as React from 'react';

type StackItem = {
  title: string
  component: React.ReactNode
}

type SheetNavigationContextType = {
  stack: StackItem[]
  push: (item: StackItem) => void
  pop: () => void
  popTo: (index: number) => void
  reset: () => void
}

const SheetNavigationContext = React.createContext<SheetNavigationContextType | undefined>(undefined)

export function SheetNavigationProvider({
  children,
  onStackEmpty,
  initialStack = [],
}: {
  children: React.ReactNode
  onStackEmpty?: () => void
  initialStack?: StackItem[]
}) {
  const [stack, setStack] = React.useState<StackItem[]>(initialStack)

  const push = React.useCallback((item: StackItem) => {
    setStack((prev) => [...prev, item])
  }, [])

  const pop = React.useCallback(() => {
    setStack((prev) => {
      const newStack = prev.slice(0, -1)
      if (newStack.length === 0) {
        onStackEmpty?.()
      }
      return newStack
    })
  }, [onStackEmpty])

  const popTo = React.useCallback((index: number) => {
    if (index < 0) return
    setStack((prev) => prev.slice(0, index + 1))
  }, [])

  const reset = React.useCallback(() => {
    setStack([])
    onStackEmpty?.()
  }, [onStackEmpty])

  const value = React.useMemo(
    () => ({ stack, push, pop, popTo, reset }),
    [stack, push, pop, popTo, reset]
  )

  return <SheetNavigationContext.Provider value={value}>{children}</SheetNavigationContext.Provider>
}

export function useSheetNavigation() {
  const context = React.useContext(SheetNavigationContext)
  if (context === undefined) {
    throw new Error('useSheetNavigation must be used within a SheetNavigationProvider')
  }
  return context
}
