type Listener<T extends {}> = (prevState: T, nextState: T) => void

export type Store<T extends {}> = {
  getState(): T
  setState(setter: (prevState: T) => T): void
  listen(fn: (prevState: T, nextState: T) => void): () => void
}

export function createStore<T extends {}>(initialState: () => T): Store<T> {
  let _state = initialState()
  let _prevState = _state

  let _listenerIdx = 1
  let _awaiting = false

  function createListenerIdx() {
    return (_listenerIdx += 1)
  }

  const _listeners: { [key: number]: Listener<T> } = {}

  return {
    getState() {
      return _state
    },
    setState(setter: (prevState: T) => T) {
      _state = setter(_state)

      if (!_awaiting) {
        _awaiting = true

        setTimeout(() => {
          _awaiting = false

          const nowState = _state
          Object.values(_listeners).map((fn) => fn(_prevState, nowState))
          _prevState = nowState
        }, 0)
      }
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
