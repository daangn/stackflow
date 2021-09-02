import React from 'react'

function isMutableRefObject<T>(ref: any): ref is React.MutableRefObject<T> {
  return (ref as React.MutableRefObject<T>) !== undefined
}

export function mergeRefs<T>(refs: Array<React.Ref<T> | undefined | null>) {
  const filteredRefs = refs.filter(Boolean)

  if (!filteredRefs.length) {
    return null
  }
  if (filteredRefs.length === 1) {
    return filteredRefs[0]
  }

  return (inst: T) => {
    for (const ref of filteredRefs) {
      if (typeof ref === 'function') {
        ref(inst)
      } else if (isMutableRefObject<T>(ref)) {
        ref.current = inst
      }
    }
  }
}
