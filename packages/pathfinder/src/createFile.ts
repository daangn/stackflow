import path from 'path'
import fs from 'fs'
import { pascalCase } from 'pascal-case'

import type { Route } from './types'
import createSdk from './createSdk'
import logger from '../utils/logger'

type FileData = {
  routes: Route[]
  name: string
  endpoint: string
  endpoints: Record<string, string>
  version: number
}

const createFile = async (
  file: { path: string; data: FileData },
  customFunction?: string,
  suffix?: string
) => {
  let createFun = createSdk
  if (customFunction) {
    try {
      const customFun = await import(customFunction)
      createFun = customFun.default
    } catch (e) {
      if (e?.code === 'ERR_MODULE_NOT_FOUND') {
        logger.warn(`Cannot find package '${customFunction}'`)
        logger.warn(`You might mistype package name, or`)
        logger.warn(`You might not install package yet.`)
        logger.warn(`pathfinder will use a basic built-in generator.`)
      } else {
        console.error('module load error: ', e)
      }
      createFun = createSdk
    }
  }
  const result = await createFun(file.data)
  const generatedDirectory = path.resolve(file.path)

  if (!fs.existsSync(generatedDirectory)) {
    fs.mkdirSync(generatedDirectory)
  }

  fs.writeFileSync(
    path.join(
      generatedDirectory,
      `${file.data.name}${suffix ? pascalCase(suffix) : 'Sdk'}.ts`
    ),
    result,
    'utf-8'
  )
}

export default createFile
