import { createContext, useContext } from 'react'
import { HashHistory } from 'history'

export const HistoryContext = createContext<HashHistory>({} as any)

HistoryContext.displayName = 'HistoryContext'

export const useHistory = () => useContext(HistoryContext)
