import React, { useRef } from 'react'

interface INodeRefProps<T> {
  children: (nodeRef: React.RefObject<T>) => React.ReactNode
}
const NodeRef = <T extends unknown>(props: INodeRefProps<T>) => {
  const nodeRef = useRef<T>(null)
  return <>{props.children(nodeRef)}</>
}

export default NodeRef
