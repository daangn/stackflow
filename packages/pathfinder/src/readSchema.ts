import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import JSON5 from 'json5'

import logger from '../utils/logger'

const readSchema = async (target: string) => {
  let jsonData = null
  const isSchemaFromRemote = target.includes('http')
  if (isSchemaFromRemote) {
    try {
      const response = await fetch(target)
      jsonData = await response.json()
    } catch (e) {
      logger.error(e)
      jsonData = null
    }
  }

  if (!jsonData) {
    let jsonFile = ''
    try {
      jsonFile = fs.readFileSync(path.resolve(`./${target}`), 'utf-8')
    } catch (e) {
      if (e?.code === 'ENOENT') {
        logger.error('Any json file can not be detected.')
        logger.error(
          'You should set the correct path if you have prepared already specific json file as schema.'
        )
        logger.error(
          'If you did not declare any schema yet, PLEASE EXECUTE COMMAND BELOW.'
        )
        logger.info('$ pathfinder init')
        return
      }
      logger.error(e)
      return
    }

    const splitTarget = target.split('.')
    const splitTargetLength = splitTarget.length

    try {
      const isJson5 = splitTarget[splitTargetLength - 1] === 'json5'
      jsonData = isJson5 ? JSON5.parse(jsonFile) : JSON.parse(jsonFile)
    } catch (e) {
      if (e?.message.includes('Unexpected token / in JSON')) {
        logger.error(
          'You should use JSON5 instead of plain JSON if you would like to use comment in schema'
        )
        logger.info(
          `You could name '${splitTarget[splitTargetLength - 2]}.json5' instead`
        )
        throw e
      }
      logger.error(e)
      throw e
    }
  }

  return jsonData
}

export default readSchema
