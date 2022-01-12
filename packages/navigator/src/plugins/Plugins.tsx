import React, {
    createContext, ReactNode,
    useContext, useEffect,
} from 'react'

const ContextPlugins = createContext<{
    lifecycleHooks: any[]
}>(null as any)

// TODO: 플러그인이 값을 저장하고, 부르고, 하위 Providers 들에게 데이터들을 전파하기 위한 공간
export const ProviderPlugins: React.FC<{plugins: any[]; children: ReactNode}> = ({children, plugins, }) => {
    const lifecycleHooks = plugins.map(plugin => plugin().lifeCycleHooks);
    const {something, setSomething} = useContext((plugins[0] as any)()?.provider)
    console.log('%csomething: ', 'color: coral;', something);

    useEffect(() => {
        setTimeout(() => {
            setSomething('why not?')
        }, 2000)
    }, [])

    return (
        <ContextPlugins.Provider value={{lifecycleHooks}}>
            {children}
        </ContextPlugins.Provider>
    )
}

export function usePlugins() {
    return useContext(ContextPlugins)
}
