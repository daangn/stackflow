export enum NavigatorParamKeys {
  SCREEN_INSTANCE_ID = '_si',
  PRESENT = '_present',
}

export interface INavigatorParams {
  screenInstanceId: string | null
  present: boolean
}

export function getNavigatorParams(
  searchParams: URLSearchParams
): INavigatorParams {
  return {
    screenInstanceId: searchParams.get(NavigatorParamKeys.SCREEN_INSTANCE_ID),
    present: searchParams.get(NavigatorParamKeys.PRESENT) === 'true',
  }
}
