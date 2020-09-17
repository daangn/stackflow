export const screenInstancePromises: {
  [screenInstanceId: string]: ((data: any | null) => void) | null
} = {}
