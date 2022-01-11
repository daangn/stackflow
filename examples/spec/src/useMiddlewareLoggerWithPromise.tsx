import { compose } from './compose';

// TODO: capsulize as private member
enum PluginTarget {
    screenInstance
}

type BeforePushType = {to: string, options: { createSomething: () => any}};

// TODO: load this type from @karrotframe/plugin later
export interface PluginType {
    target: PluginTarget;
    handlers?: {[funName: string]: () => void;};
    lifeCycleHooks: {
        beforePush?: (context: BeforePushType, next: () => Promise<void>) => Promise<BeforePushType | void>;
        onPushed?: (to: string, next: () => void) => void;
        beforePop?: (from: string) => void;
        onPopped?: (from: string, data: any, options: any) => void;
    }
}

const customMiddleWareFirst = async (ctx: {to: string, options: {createSomething: () => any}}, next: () => Promise<any>) => {
    console.log('before promise in first middleware', ctx.to);
    await next();
    console.log('after promise in first middleware', ctx.to);
}
const customMiddleWareSecond = (ctx: {to: string, options: {createSomething: () => any}}, next: () => Promise<any>) => {
    console.log('before promise in second middleware: ', ctx.to);
    next();
    console.log('after promise in second middleware', ctx.to);
}
const customMiddleWareThird = async (ctx: {to: string, options: {createSomething: () => any}}, next: () => Promise<any>) => {
    console.log('before promise in third middleware', ctx.to);
    await next();
    console.log('after promise in third middleware', ctx.to);
}

const customMiddleWareFourth = async (ctx: {to: string, options: {createSomething: () => any}}, next: () => Promise<any>) => {
    console.log('before promise in fourth middleware', ctx.to);
    await next();
    console.log('after promise in fourth middleware', ctx.to);
}
const customMiddleWareFifth = async (ctx: {to: string, options: {createSomething: () => any}}, next: () => Promise<any>) => {
    console.log('before promise in fifth middleware', ctx.to);
    await next();
    console.log('after promise in fifth middleware', ctx.to);
}
const customMiddleWareSixth = async (ctx: {to: string, options: {createSomething: () => any}}, next: () => Promise<any>) => {
    console.log('before promise in sixth middleware', ctx.to);
    await next();
    console.log('after promise in sixth middleware', ctx.to);
}

export const useMiddlewareLoggerWithPromise = (): PluginType => {
    return {
        target: PluginTarget.screenInstance,
        lifeCycleHooks: {
            beforePush: compose<BeforePushType>([customMiddleWareFirst, customMiddleWareSecond, customMiddleWareThird, customMiddleWareFourth, customMiddleWareFifth, customMiddleWareSixth]),
        },
    }
}