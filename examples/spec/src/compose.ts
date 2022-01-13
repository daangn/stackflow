type Middleware<T> = ((ctx: T, next?: () => Promise<T | void>) => Promise<T | void>) | undefined;

// This is perfectly same with koa-compose
// FIXME: find alternative name instead of context
export const compose = <T>(middleware: Middleware<T>[]): ((context: T, next?: () => Promise<T | void>) => Promise<T | void>) | undefined => {
    if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
    for (const fn of middleware) {
        if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
    }

    return function (context: T, next?: () => Promise<T | void>) : Promise<T | void> {
        let index = -1
        return dispatch(0)
        function dispatch (i: number): Promise<void | T> {
            if (i <= index) return Promise.reject(new Error('next() called multiple times'))
            index = i
            let fn = middleware[i]
            if (i === middleware.length) fn = next
            if (!fn) return Promise.resolve()
            try {
                return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}