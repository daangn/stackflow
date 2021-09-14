import React, { useEffect } from 'react'

interface IOnMountProps {
  onMount: () => void
  onUnmount: () => void
}
const OnMount: React.FC<IOnMountProps> = (props) => {
  useEffect(() => {
    props.onMount()

    return () => {
      props.onUnmount()
    }
  }, [props.onMount])

  return null
}

export default OnMount
