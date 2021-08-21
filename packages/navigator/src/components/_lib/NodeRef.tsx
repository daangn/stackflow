import React, { useRef } from 'react'

interface NodeRefProps<T> {
  children: (nodeRef: React.RefObject<T>) => React.ReactNode
}
const NodeRef = <T extends unknown>(props: NodeRefProps<T>) => {
  const nodeRef = useRef<T>(null)
  return <>{props.children(nodeRef)}</>
}

export default NodeRef
