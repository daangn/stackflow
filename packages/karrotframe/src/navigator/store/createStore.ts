type Listener<T extends {}> = (prevState: T, nextState: T) => void

export type Store<T extends {}> = {
  getState(): T
  setState(setter: (prevState: T) => T): void
  listen(
    fn: (prevState: T, nextState: T) => void,
    execute?: boolean
  ): () => void
}

export function createStore<T extends {}>(initialState: () => T): Store<T> {
  let _state = initialState()
  let _listenerIdx = 1

  function createListenerIdx() {
    return (_listenerIdx += 1)
  }

  const _listeners: { [key: number]: Listener<T> } = {}

  return {
    getState() {
      return _state
    },
    setState(setter: (prevState: T) => T) {
      const prevState = _state
      _state = setter(_state)
      const state = _state

      Object.values(_listeners).map((fn) => fn(prevState, state))
    },
    listen(fn: (prevState: T, nextState: T) => void) {
      const idx = createListenerIdx()

      _listeners[idx] = fn

      function dispose() {
        delete _listeners[idx]
      }

      return dispose
    },
  }
}
