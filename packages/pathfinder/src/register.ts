import fetch from 'node-fetch'
import { cosmiconfig } from 'cosmiconfig'

import logger from '../utils/logger'

const register = async (
  schemaPath: string,
  {
    repository,
    debug,
  }: {
    repository?: string
    debug?: boolean
  }
) => {
  try {
    const currentRepository = repository ?? (await loadRepository())
    if (!currentRepository) {
      logger.error(
        'No repository path. It should be declared before registering schema'
      )
      return
    }
    const response = await fetch(currentRepository, {
      method: 'POST',
      body: schemaPath,
    })
    const result = await response.text()
    logger.info(result)
  } catch (e) {
    if (debug) {
      logger.error(e)
    }
    logger.error('Failed to register schema to repository')
  }
}

const loadRepository = async () => {
  const explorer = cosmiconfig('pathfinder')
  const search = await explorer.search()
  return search?.config?.repository
}

export default register
