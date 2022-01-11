import {useState, useCallback } from "react";

// TODO: capsulize as private member
enum PluginTarget {
    screenInstance
}

type BeforePushType = {to: string, options: { createSomething: () => any}};

// TODO: load this type from @karrotframe/plugin later
// FIXME: 매개변수를 context, next 로 2개만 선언할 것. context 에서 optional 하게 to 나 data 등의 정보를 받아온다.
export interface PluginType {
    target: PluginTarget;
    handlers: {[funName: string]: () => void;};
    lifeCycleHooks: {
        beforePush?: (context: BeforePushType, next: () => Promise<void>) => Promise<BeforePushType | void>;
        onPushed?: (to: string, next: () => void) => void;
        beforePop?: (from: string) => void;
        onPopped?: (from: string, data: any, options: any) => void;
        onPoppedWithData?: (from: string, data: any, options: any) => void;
    }
}

export const useData = (): PluginType & { dataFromNextPage: ({from}: {from: string}) => any } => {
    const [data, setData] = useState(null);
    const loadData = useCallback((from?: string) => {
        return from? data?.[from] : data;
    }, [data])

    return {
        target: PluginTarget.screenInstance,
        handlers: { loadData },
        lifeCycleHooks: {
            onPoppedWithData: (from: string, data: any, options: any) => {
                setData((prev: any) => ({
                    ...prev,
                    [from]: data
                }))
            },
        },
        dataFromNextPage: ({ from }: {from: string}) => {
            return data?.[from] ?? 'no data';
        },
    }
}