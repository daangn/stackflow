import {useState, useCallback } from "react";

// TODO: capsulize as private member
enum PluginTarget {
    screenInstance
}

type BeforePushType = {to: string, options: { createSomething: () => any}};

// TODO: load this type from @karrotframe/plugin later
// FIXME: 매개변수를 context, next 로 2개만 선언할 것. context 에서 optional 하게 to 나 data 등의 정보를 받아온다.
export interface PluginType {
    handlers: {[funName: string]: (params: any) => any;};
    lifeCycleHooks: {
        beforePush?: (context: BeforePushType, next: () => Promise<void>) => Promise<BeforePushType | void>;
        onPushed?: (to: string, next: () => void) => void;
        beforePop?: (from: string) => void;
        onPopped?: (from: string, data: any, options: any) => void;
        onPoppedWithData?: (from: string, data: any, options: any) => void;
    }
}

export const useData = (): PluginType => {
    const [data, setData] = useState(null);

    return {
        handlers: {
            dataFromNextPage: ({ from }: {from: string}) => {
                return data?.[from] ?? 'no data';
            },
        },
        lifeCycleHooks: {
            onPoppedWithData: (from: string, data: any, options: any) => {
                setData((prev: any) => ({
                    ...prev,
                    [from]: data
                }))
            },
        },
    }
}