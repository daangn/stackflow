import React, { Suspense, useEffect, useReducer, useState } from 'react'

import { PropsOf } from '../../types/PropsOf'

type SuspenseProps = PropsOf<typeof Suspense>

type SuspenseTransitionProps = {
  in: boolean
  timeout: number
  fallback: (status: SuspenseTransitionStatus) => SuspenseProps['fallback']
  children: (
    status: SuspenseTransitionStatus,
    mount: boolean
  ) => React.ReactNode
}
export type SuspenseTransitionStatus =
  | 'enterActive'
  | 'enterDone'
  | 'exitActive'
  | 'exitDone'

const SuspenseTransition: React.FC<SuspenseTransitionProps> = (props) => {
  const [status, setStatus] = useState<SuspenseTransitionStatus>('exitDone')
  const [inited, init] = useReducer(() => true, false)
  const [mount, setMount] = useState<boolean>(true)

  useEffect(() => {
    ;(async () => {
      if (props.in) {
        init()
        setMount(true)
        await delay(0)
        setStatus('enterActive')
        await delay(props.timeout)
        setStatus('enterDone')
      } else {
        setStatus('exitActive')
        await delay(props.timeout)
        setStatus('exitDone')
        await delay(0)

        if (inited) {
          setMount(false)
        }
      }
    })()
  }, [props.in, props.timeout, setMount])

  return (
    <Suspense fallback={props.fallback(status)}>
      {props.children(status, mount)}
    </Suspense>
  )
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default SuspenseTransition
