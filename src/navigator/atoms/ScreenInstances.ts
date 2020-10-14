import { atom } from 'recoil'

export interface ScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
}
export const AtomScreenInstances = atom<ScreenInstance[]>({
  key: 'KFScreenInstances',
  default: [],
})
