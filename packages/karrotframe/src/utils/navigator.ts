export const NavigatorParamKeys = {
  screenInstanceId: '_si',
  present: '_present',
}

export type NavigatorParams = {
  screenInstanceId: string | null,
  present: boolean,
}

export function getNavigatorParams(searchParams: URLSearchParams): NavigatorParams {
  return {
    screenInstanceId: searchParams.get(NavigatorParamKeys.screenInstanceId),
    present: searchParams.get(NavigatorParamKeys.present) === 'true',
  }
}
