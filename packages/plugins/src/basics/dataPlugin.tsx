import React, { createContext, useContext, useState, useMemo } from 'react'
import { KarrotframePlugin, PluginType } from '../types/navigator'

export const ContextDataPlugin = createContext<{
  data: any
  setData: (data: any) => void
}>(null as any)

export const DataPluginProvider: React.FC = (props) => {
  const [data, setData] = useState<any>(null)
  return (
    <ContextDataPlugin.Provider value={{ data, setData }}>
      {props.children}
    </ContextDataPlugin.Provider>
  )
}

export const useDataPlugin = (): PluginType & {
  dataFromNextPage: (params: { from: string }) => any
} => {
  const context = useContext(ContextDataPlugin)

  return useMemo(() => {
    return {
      lifeCycleHooks: {
        onPoppedWithData: async ({ from, data }) => {
          context.setData({ [from]: data })
        },
      },
      dataFromNextPage: ({ from }: { from: string }) => context?.data?.[from],
    }
  }, [context])
}

export const dataPlugin: KarrotframePlugin = {
  name: 'dataPlugin',
  provider: DataPluginProvider,
  executor: useDataPlugin,
}
