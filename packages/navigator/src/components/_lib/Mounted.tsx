import React, { useEffect, useReducer } from 'react'

interface IMountedProps {
  children: (mounted: boolean) => React.ReactNode
}
const Mounted = (props: IMountedProps) => {
  const [mounted, mount] = useReducer(() => true, false)

  useEffect(() => {
    mount()
  }, [mount])

  return <>{props.children(mounted)}</>
}

export default Mounted
