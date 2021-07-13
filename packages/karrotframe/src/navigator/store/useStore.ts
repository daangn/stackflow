import deepEqual from 'fast-deep-equal'
import { useEffect, useState } from 'react'

import { Store } from './createStore'

export function useStore<T extends {}, V>(
  store: Store<T>,
  selector: (state: T) => V
): V {
  const [value, setValue] = useState(() => {
    return selector(store.getState())
  })

  useEffect(() => {
    const fn = (prevState: T | null, nextState: T) => {
      const prevValue = prevState && selector(prevState)
      const nextValue = selector(nextState)

      if (
        (prevValue && !deepEqual(prevValue, nextValue)) ||
        !deepEqual(value, nextValue)
      ) {
        setValue(nextValue)
      }
    }

    fn(null, store.getState())
    const dispose = store.listen(fn, true)

    return () => {
      dispose()
    }
  }, [store, selector, setValue])

  return value
}
