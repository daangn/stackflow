import path from 'path'
import fs from 'fs'

import type { Route } from './types'
import createSdk from './createSdk'

type FileData = {
  routes: Route[]
  name: string
  endpoint: string
  endpoints: Record<string, string>
  version: number
}

const createFile = async (
  file: { path: string; data: FileData },
  customFunction?: string
) => {
  let createFun = createSdk
  if (customFunction) {
    try {
      const customFun = await import(customFunction)
      createFun = customFun.default
    } catch (e) {
      createFun = createSdk
    }
  }
  const result = await createFun(file.data)
  const generatedDirectory = path.resolve(file.path)

  if (!fs.existsSync(generatedDirectory)) {
    fs.mkdirSync(generatedDirectory)
  }

  fs.writeFileSync(
    path.join(generatedDirectory, `${file.data.name}Sdk.ts`),
    result,
    'utf-8'
  )
}

export default createFile
