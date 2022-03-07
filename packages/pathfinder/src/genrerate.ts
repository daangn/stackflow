import getDataFromOptions from './getDataFromOptions'
import readSchema from './readSchema'
import validateSchema from './validateSchema'
import createFile from './createFile'

const generate = async ({
  source,
  output,
  debug,
  replace,
  suffix,
}: {
  source?: string
  output?: string
  debug?: boolean
  replace?: string
  suffix?: string
}) => {
  try {
    const { generatePath, target, customFunction, suffixName } =
      await getDataFromOptions({
        source,
        output,
        replace,
        suffix,
      })

    const jsonData = await readSchema(target)
    validateSchema(jsonData)

    const file = {
      path: generatePath,
      data: jsonData,
    }

    await createFile(file, customFunction, suffixName)
  } catch (e) {
    if (debug) {
      console.error(e)
    }
    return
  }
}

export default generate
