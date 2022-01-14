import { compose } from '../compose';

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

export interface PluginType {
    lifeCycleHooks: {
        beforePush?: (context: BeforePushType, next: () => Promise<BeforePushType | void>) => Promise<BeforePushType | void>;
        onPushed?: (context: OnPushedType, next: () => Promise<OnPushedType | void>) => Promise<OnPushedType | void>;
        beforePop?: (context: BeforePop, next: () => Promise<BeforePop | void>) => Promise<BeforePop | void>;
        onPopped?: (context: OnPopped, next: () => Promise<OnPopped | void>) => Promise<OnPopped | void>;
        onPoppedWithData?: (context: OnPoppedWithDataType, next: () => Promise<OnPoppedWithDataType | void>) => void;
    };
    decorator?: React.FC;
}
const customMiddlewareFirst = async (ctx: BeforePushType, next: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>   => {
    console.log('before promise in first middleware', ctx.to);
    await next();
    console.log('after promise in first middleware', ctx.to);
}
const customMiddlewareSecond = async (ctx: BeforePushType, next: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in second middleware: ', ctx.to);
    next();
    console.log('after promise in second middleware', ctx.to);
}
const customMiddlewareThird = async (ctx: BeforePushType, next: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in third middleware', ctx.to);
    await next();
    console.log('after promise in third middleware', ctx.to);
}


export const useMiddlewareLoggerWithPromise = (): PluginType => {
    return {
        lifeCycleHooks: {
            beforePush: compose<BeforePushType>([customMiddlewareFirst, customMiddlewareSecond, customMiddlewareThird]),
        },
    }
}
type KarrotframePlugin = {
    name: string;
    provider?: React.FC;
    executor: () => PluginType;
}

export const middlewareLoggerPlugin: KarrotframePlugin = {
    name: 'middlewareLoggerPlugin',
    executor: useMiddlewareLoggerWithPromise
}