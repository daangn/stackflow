type Middleware<T> = ((ctx: T, next: (newCtx?: T) => Promise<T | void>) => Promise<T | void>) | undefined;

// This is perfectly same with koa-compose
const composeMiddlewares = <T>(middlewares: Middleware<T>[]): ((context: T, next: (newCtx?: T) => Promise<T | void>) => Promise<T | void>) | undefined => {
    if (!Array.isArray(middlewares)) throw new TypeError('Middleware stack must be an array!')
    for (const fn of middlewares) {
        if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
    }

    return function (context: T, next: (newCtx?: T) => Promise<T | void>) : Promise<T | void> {
        let index = -1
        return dispatch(0)
        async function dispatch (i: number, modifiedContext?: T): Promise<void | T> {
            if (i <= index) return Promise.reject(new Error('next() called multiple times'))
            index = i
            let fn = middlewares[i]
            if (i === middlewares.length) fn = next
            if (!fn) return Promise.resolve()
            try {
                const passingContext = modifiedContext || context;
                return Promise.resolve(fn(passingContext, dispatch.bind(null, i + 1)));
            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}

export default composeMiddlewares;