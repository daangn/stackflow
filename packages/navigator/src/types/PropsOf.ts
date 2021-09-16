import React from 'react'

export type PropsOf<T extends React.ComponentType> =
  T extends React.ComponentType<infer U> ? U : unknown
