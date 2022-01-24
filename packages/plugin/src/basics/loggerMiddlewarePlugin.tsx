import type {
  BeforePushType,
  NavigatorPluginType,
  PluginType,
} from '../types/navigator'
import composeMiddlewares from '../utils/composeMiddlewares'

const customMiddlewareFirst = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  console.log('before promise in first middleware', ctx.to)
  await next()
  console.log('after promise in first middleware', ctx.to)
}
const customMiddlewareSecond = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  console.log('before promise in second middleware: ', ctx.to)
  next()
  console.log('after promise in second middleware', ctx.to)
}
const customMiddlewareThird = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  console.log('before promise in third middleware', ctx.to)
  await next()
  console.log('after promise in third middleware', ctx.to)
}

const useLoggerMiddlewareBeforePushPlugin = (): PluginType => {
  return {
    lifeCycleHooks: {
      beforePush: composeMiddlewares<BeforePushType>([
        customMiddlewareFirst,
        customMiddlewareSecond,
        customMiddlewareThird,
      ]),
    },
  }
}

export const loggerMiddlewareBeforePushPlugin: NavigatorPluginType = {
  name: 'loggerMiddlewareBeforePushPlugin',
  executor: useLoggerMiddlewareBeforePushPlugin,
}
