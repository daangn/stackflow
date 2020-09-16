export const screenInstancePromises: {
  [screenInstanceId: string]: ((data: object | null) => void) | null
} = {}
