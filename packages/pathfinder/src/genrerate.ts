import fs from 'fs'
import path from 'path'

import getDataFromOptions from './getDataFromOptions'
import readSchema from './readSchema'
import validateSchema from './validateSchema'
import createSdk from './createSdk'

const generate = async ({
  source,
  output,
  debug,
}: {
  source?: string
  output?: string
  debug?: boolean
}) => {
  try {
    const { generatePath, target } = await getDataFromOptions(source, output)
    const jsonData = await readSchema(target)
    validateSchema(jsonData)

    const result = await createSdk(jsonData)
    const generatedDirectory = path.resolve(generatePath)

    if (!fs.existsSync(generatedDirectory)) {
      fs.mkdirSync(generatedDirectory)
    }

    fs.writeFileSync(
      path.join(generatedDirectory, `${jsonData.name}Sdk.ts`),
      result,
      'utf-8'
    )
  } catch (e) {
    if (debug) {
      console.error(e)
    }
    return
  }
}

export default generate
