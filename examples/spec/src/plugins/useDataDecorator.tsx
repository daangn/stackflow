import React, { createContext, useContext, useState, useMemo } from "react";

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

export interface LifeCycleHooks {
    beforePush?: (context: BeforePushType, next?: () => Promise<BeforePushType | void>) => Promise<BeforePushType | void>;
    onPushed?: (context: OnPushedType, next?: () => Promise<OnPushedType | void>) => Promise<OnPushedType | void>;
    beforePop?: (context: BeforePop, next?: () => Promise<BeforePop | void>) => Promise<BeforePop | void>;
    onPopped?: (context: OnPopped, next?: () => Promise<OnPopped | void>) => Promise<OnPopped | void>;
    onPoppedWithData?: (context: OnPoppedWithDataType, next?: () => Promise<OnPoppedWithDataType | void>) => void;
}

export interface PluginType {
    lifeCycleHooks: LifeCycleHooks;
}

export const ContextDataPlugin = createContext<{ data: any; setData: (data: any) => void; }>(null as any)

export const DataPluginProvider: React.FC = (props) => {
    const [data, setData] = useState<any>(null);

    return (
        <ContextDataPlugin.Provider value={{data, setData}}>
            {props.children}
        </ContextDataPlugin.Provider>
    )
}

export const useDataDecorator = (): PluginType & { dataFromNextPage: (params: {from: string}) => any; }  => {
    const context = useContext(ContextDataPlugin);

    return useMemo(() => {
        return {
            lifeCycleHooks: {
                onPoppedWithData: ({from, data}) => {
                    context.setData({[from]: data})
                },
            },
            dataFromNextPage: ({ from }: {from: string}) => context?.data?.[from]
        };
    }, [context])
}

type KarrotframePlugin = {
    name: string;
    provider?: React.FC;
    executor: () => PluginType;
}

export const dataPlugin: KarrotframePlugin = {
    name: 'dataPlugin',
    provider: DataPluginProvider,
    executor: useDataDecorator
}