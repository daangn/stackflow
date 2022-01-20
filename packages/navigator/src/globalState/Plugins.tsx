import React, { createContext, ReactNode, useContext } from 'react'

const ContextPlugins = createContext<{
  lifecycleHooks: any[]
}>(null as any)

export const ProviderPlugins: React.FC<{
  plugins: any[]
  children: ReactNode
}> = ({ children, plugins }) => {
  const lifecycleHooks = plugins.map(
    (plugin) => plugin.executor().lifeCycleHooks
  )

  return (
    <ContextPlugins.Provider value={{ lifecycleHooks }}>
      {children}
    </ContextPlugins.Provider>
  )
}

export function usePlugins() {
  return useContext(ContextPlugins)
}
