import React from 'react'

export interface ICustomSpinnerProps {
  offset: number
  refreshing: boolean
}

export type ICustomSpinner = React.ComponentType<ICustomSpinnerProps>
