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
        beforePush?: (context: BeforePushType, next?: () => Promise<BeforePushType | void>) => Promise<BeforePushType | void>;
        onPushed?: (context: OnPushedType, next?: () => Promise<OnPushedType | void>) => Promise<OnPushedType | void>;
        beforePop?: (context: BeforePop, next?: () => Promise<BeforePop | void>) => Promise<BeforePop | void>;
        onPopped?: (context: OnPopped, next?: () => Promise<OnPopped | void>) => Promise<OnPopped | void>;
        onPoppedWithData?: (context: OnPoppedWithDataType, next?: () => Promise<OnPoppedWithDataType | void>) => void;
    };
    decorator?: React.FC;
}
const customMiddleWareFirst = async (ctx: BeforePushType, next?: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>   => {
    console.log('before promise in first middleware', ctx.to);
    if(next) {
        await next();
    }
    console.log('after promise in first middleware', ctx.to);
}
const customMiddleWareSecond = async (ctx: BeforePushType, next?: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in second middleware: ', ctx.to);
    if(next) { next(); }
    console.log('after promise in second middleware', ctx.to);
}
const customMiddleWareThird = async (ctx: BeforePushType, next?: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in third middleware', ctx.to);
    if(next) {
        await next();
    }
    console.log('after promise in third middleware', ctx.to);
}
const customMiddleWareFourth = async (ctx: BeforePushType, next?: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in fourth middleware', ctx.to);
    if(next) {
        await next();
    }
    console.log('after promise in fourth middleware', ctx.to);
}
const customMiddleWareFifth = async (ctx: BeforePushType, next?: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in fifth middleware', ctx.to);
    if(next) {
        await next();
    }
    console.log('after promise in fifth middleware', ctx.to);
}
const customMiddleWareSixth = async (ctx: BeforePushType, next?: () => Promise<BeforePushType | void>): Promise<BeforePushType | void>  => {
    console.log('before promise in sixth middleware', ctx.to);
    if(next) {
        await next();
    }
    console.log('after promise in sixth middleware', ctx.to);
}

export const useMiddlewareLoggerWithPromise = (): PluginType => {
    return {
        lifeCycleHooks: {
            beforePush: compose<BeforePushType>([customMiddleWareFirst, customMiddleWareSecond, customMiddleWareThird, customMiddleWareFourth, customMiddleWareFifth, customMiddleWareSixth]),
        },
    }
}
type KarrotframePlugin = {
    provider?: React.FC;
    executor: () => PluginType;
}

export const middlewareLoggerPlugin: KarrotframePlugin = {
    executor: useMiddlewareLoggerWithPromise
}