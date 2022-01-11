import React, {
    createContext, ReactNode,
    useContext,
    useState,
} from 'react'

const ContextPlugins = createContext<{
    plugins: any;
    setPlugins: (plugin: any) => void;
}>(null as any)

export const ProviderPlugins: React.FC<{plugins: any[]; children: ReactNode}> = ({children, plugins: currentPlugins}) => {
    const [plugins, setPlugins] = useState(currentPlugins);

    return (
        <ContextPlugins.Provider value={{plugins, setPlugins}}>
            {children}
        </ContextPlugins.Provider>
    )
}

export function usePlugins() {
    return useContext(ContextPlugins)
}
