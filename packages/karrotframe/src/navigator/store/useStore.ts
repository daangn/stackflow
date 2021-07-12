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
    const dispose = store.listen((prevState, nextState) => {
      const prevValue = selector(prevState)
      const nextValue = selector(nextState)

      if (prevValue !== nextValue || value !== nextValue) {
        setValue(nextValue)
      }
    })

    return () => {
      dispose()
    }
  }, [store, selector, setValue])

  return value
}
