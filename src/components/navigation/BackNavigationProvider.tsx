import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type BackNavigation = {
  visible: boolean
  onBack: () => void
}

type StackEntry = {
  id: number
  navigation: BackNavigation
}

type BackNavigationContextValue = {
  navigation: BackNavigation
  register: (navigation: BackNavigation) => () => void
}

const HIDDEN_NAVIGATION: BackNavigation = {
  visible: false,
  onBack: () => undefined,
}

const BackNavigationContext =
  createContext<BackNavigationContextValue | null>(null)

function topNavigation(stack: StackEntry[]): BackNavigation {
  return stack.at(-1)?.navigation ?? HIDDEN_NAVIGATION
}

export function BackNavigationProvider({ children }: { children: ReactNode }) {
  const [navigation, setNavigation] =
    useState<BackNavigation>(HIDDEN_NAVIGATION)
  const stackRef = useRef<StackEntry[]>([])
  const nextIdRef = useRef(0)

  const register = useCallback((nextNavigation: BackNavigation) => {
    nextIdRef.current += 1
    const id = nextIdRef.current
    stackRef.current = [...stackRef.current, { id, navigation: nextNavigation }]
    setNavigation(nextNavigation)

    return () => {
      stackRef.current = stackRef.current.filter((entry) => entry.id !== id)
      setNavigation(topNavigation(stackRef.current))
    }
  }, [])

  return (
    <BackNavigationContext.Provider value={{ navigation, register }}>
      {children}
    </BackNavigationContext.Provider>
  )
}

export function useBackNavigation(
  onBack: () => void,
  visible = true,
): void {
  const context = useContext(BackNavigationContext)
  const register = context?.register
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    if (!register) return
    return register({
      visible,
      onBack: () => onBackRef.current(),
    })
  }, [register, visible])
}

export function useCurrentBackNavigation(): BackNavigation {
  const context = useContext(BackNavigationContext)
  return context?.navigation ?? HIDDEN_NAVIGATION
}
