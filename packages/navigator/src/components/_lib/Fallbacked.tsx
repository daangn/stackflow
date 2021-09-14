import React, { useState } from 'react'

interface IFallbackedProps {
  children: (
    setFallbacked: (fallbacked: boolean) => void,
    fallbacked: boolean
  ) => React.ReactNode
}
const Fallbacked = (props: IFallbackedProps) => {
  const [fallbacked, setFallbacked] = useState(false)

  return <>{props.children(setFallbacked, fallbacked)}</>
}

export default Fallbacked
