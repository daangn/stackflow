import React, {createContext, useContext, useState, useCallback, ReactNode, useMemo} from "react";

type BeforePushType = {to: string, options: { createSomething: () => any}};

export interface PluginType {
    lifeCycleHooks: {
        beforePush?: (context: BeforePushType, next: () => Promise<void>) => Promise<BeforePushType | void>;
        onPushed?: (to: string, next: () => void) => void;
        beforePop?: (from: string) => void;
        onPopped?: (from: string, data: any, options: any) => void;
        onPoppedWithData?: (from: string, data: any, options: any) => void;
    }
}

export const ContextPluginsDirty = createContext<{
    data: any;
    setData: (data: any) => void;
    something: any;
    setSomething: (something:any) => void;
}>(null as any)

export const ProviderDataPluginsDirty: React.FC = (props) => {
    const [data, setData] = useState<any>({hello: 'none'});
    const [something, setSomething] = useState<any>('hi high!');
    console.log('%csomething: ', 'background: white; color: lightskyblue;', something);

    return (
        <ContextPluginsDirty.Provider value={{data, setData, something, setSomething}}>
            {props.children}
        </ContextPluginsDirty.Provider>
    )
}

export const useDataDecoratorDirty = () => {
    const ctx = useContext(ContextPluginsDirty);

    const onPoppedWithDataCallback = useCallback(({from, data, options}) => {
        ctx?.setData?.({[from]: data})
    }, [ctx])

    return useMemo(() => {
        return {
            provider: ContextPluginsDirty,
            lifeCycleHooks: {
                onPoppedWithData: onPoppedWithDataCallback,
            },
            decorators: (children: ReactNode) => (<ProviderDataPluginsDirty>{children}</ProviderDataPluginsDirty>),
            decorators2: ProviderDataPluginsDirty,
            dataFromNextPage: ({ from }: {from: string}) => {
                return ctx?.data?.[from];
            },
            certainValue: () => {
                return ctx?.something;
            },
        };
    }, [ctx, onPoppedWithDataCallback])
}

export const useDataContextDirty = () => {
    return useContext(ContextPluginsDirty)
}
