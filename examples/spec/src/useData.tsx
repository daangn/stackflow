import {useState, useCallback} from "react";

// TODO: capsulize as private member
enum PluginTarget {
    screenInstance
}

// TODO: load this type from @karrotframe/plugin later
export interface PluginType {
    target:PluginTarget;
    isDataRequired: boolean;
    handlers: {[funName: string]: () => void;};
    listeners: {
        beforePush?: (to: string) => void;
        onPushed?: (to: string) => void;
        beforePop?: (from: string) => void;
        onPopped?: (from: string, data: any, options: any) => void;
    }
}

export const useData = (): PluginType => {
    const [data, setData] = useState(null);
    const loadData = useCallback((from?: string) => {
        return from? data?.[from] : data;
    }, [data])

    return {
        target: PluginTarget.screenInstance,
        isDataRequired: true, // FIXME: This would be redundant but hold for some time
        handlers: { loadData },
        listeners: {
            onPopped: (from: string, data: any, options: any) => {
                setData((prev: any) => ({
                    ...prev,
                    [from]: data
                }))
            },
        },
    }
}