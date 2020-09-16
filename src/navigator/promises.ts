export const promises: {
  [screenInstanceId: string]: ((data: object | null) => void) | null
} = {}
