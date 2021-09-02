import React from 'react'

export interface ICustomSpinnerProps {
  t: number
  refreshing: boolean
}

export type ICustomSpinner = React.ComponentType<ICustomSpinnerProps>
