import { atom } from 'recoil'

export interface ScreenInstance {
  id: string
  screenId: string
}
export const AtomScreenInstances = atom<ScreenInstance[]>({
  key: 'KFScreenInstances',
  default: [],
})
