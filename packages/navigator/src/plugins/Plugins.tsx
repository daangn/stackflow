import React, {
    createContext,
    ReactNode,
    useContext
} from 'react'

type Options = { createSomething: () => any}
interface HookParams {
    options: Options
}
interface BeforePushType extends HookParams {
    to: string;
}
interface OnPushedType extends HookParams {
    to: string;
}
interface BeforePop extends HookParams {
    from: string;
}
interface OnPopped extends HookParams {
    from: string;
}
interface OnPoppedWithDataType extends HookParams {
    from: string;
    data?: any;
}

interface LifeCycleHooks {
    beforePush?: (context: BeforePushType, next?: () => Promise<BeforePushType | void>) => Promise<BeforePushType | void>;
    onPushed?: (context: OnPushedType, next?: () => Promise<OnPushedType | void>) => Promise<OnPushedType | void>;
    beforePop?: (context: BeforePop, next?: () => Promise<BeforePop | void>) => Promise<BeforePop | void>;
    onPopped?: (context: OnPopped, next?: () => Promise<OnPopped | void>) => Promise<OnPopped | void>;
    onPoppedWithData?: (context: OnPoppedWithDataType, next?: () => Promise<OnPoppedWithDataType | void>) => void;
}

const ContextPlugins = createContext<{
    lifecycleHooks: LifeCycleHooks[]
}>(null as any)

export const ProviderPlugins: React.FC<{plugins: any[]; children: ReactNode}> = ({children, plugins, }) => {
    const lifecycleHooks = plugins.map(plugin => plugin.executor().lifeCycleHooks);

    return (
        <ContextPlugins.Provider value={{lifecycleHooks}}>
            {children}
        </ContextPlugins.Provider>
    )
}

export function usePlugins() {
    return useContext(ContextPlugins)
}
