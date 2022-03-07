import getDataFromOptions from './getDataFromOptions'
import readSchema from './readSchema'
import validateSchema from './validateSchema'
import createFile from './createFile'

const generate = async ({
  source,
  output,
  debug,
  replace,
}: {
  source?: string
  output?: string
  debug?: boolean
  replace?: string
}) => {
  try {
    const { generatePath, target } = await getDataFromOptions(source, output)
    const jsonData = await readSchema(target)
    validateSchema(jsonData)

    const file = {
      path: generatePath,
      data: jsonData,
    }

    await createFile(file, replace)
  } catch (e) {
    if (debug) {
      console.error(e)
    }
    return
  }
}

export default generate
