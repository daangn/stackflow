enum K {
  SCREEN_INSTANCE_ID = '_si',
  IS_PRESENT = '_present',
}

export function makeNavigatorSearchParams(
  init: string | string[][] | Record<string, string> | URLSearchParams | null,
  {
    screenInstanceId,
    present,
  }: {
    screenInstanceId: string
    present?: boolean
  }
) {
  const searchParams = new URLSearchParams(init ?? '')
  searchParams.set(K.SCREEN_INSTANCE_ID, screenInstanceId)

  if (present) {
    searchParams.set(K.IS_PRESENT, 'true')
  } else {
    searchParams.delete(K.IS_PRESENT)
  }

  return {
    toString: () => searchParams.toString(),
    toObject: () => ({
      screenInstanceId,
      present: !!present,
    }),
  }
}

export function parseNavigatorSearchParams(
  init: string | string[][] | Record<string, string> | URLSearchParams
) {
  const searchParams = new URLSearchParams(init)

  const screenInstanceId = searchParams.get(K.SCREEN_INSTANCE_ID)
  const present = searchParams.get(K.IS_PRESENT) === 'true'

  if (!screenInstanceId) {
    throw new Error('screenInstanceId not found')
  }

  return makeNavigatorSearchParams(null, {
    screenInstanceId,
    present,
  })
}
