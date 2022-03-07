import { cosmiconfig } from 'cosmiconfig'

import logger from '../utils/logger'

const getDataFromOptions = async (options: {
  source?: string
  output?: string
  replace?: string
  suffix?: string
}): Promise<{
  generatePath: string
  target: string
  customFunction?: string | undefined
  suffixName?: string | undefined
}> => {
  let optionsFromConfig: {
    source?: string
    output?: string
    replace?: string
    suffix?: string
  } = {}
  try {
    const explorer = cosmiconfig('pathfinder')
    const search = await explorer.search()
    optionsFromConfig = search?.config ?? {}
  } catch (e) {
    if (e?.code.includes('ERR_REQUIRE_ESM')) {
      logger.error(
        "'pathfinder.config.js' or 'pathfinder.config.cjs' is not available for config file because of ESM issue."
      )
      logger.error(
        'And then, your config file will be ignored and CLI options would be applied if provided.'
      )
      logger.info("Use '.pathfinderrc.json' or '.pathfinderrc' instead")
      throw e
    }
    logger.error(e)
    throw e
  }

  const generatePath =
    options?.output ?? optionsFromConfig?.output ?? '__generated__'
  const target = options?.source ?? optionsFromConfig?.source

  if (!target) {
    logger.error('Any json file can not be detected.')
    logger.error(
      'You should set the correct path if you have prepared already specific json file as schema.'
    )
    logger.error(
      'If you did not declare any schema yet, PLEASE EXECUTE COMMAND BELOW.'
    )
    logger.info('$ pathfinder init')
    throw new Error('no target schema')
  }

  return {
    target,
    generatePath,
    customFunction: options?.replace ?? optionsFromConfig?.replace ?? undefined,
    suffixName: options?.suffix ?? optionsFromConfig?.suffix ?? undefined,
  }
}

export default getDataFromOptions
