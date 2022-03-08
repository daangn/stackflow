import Ajv from 'ajv'

import logger from '../utils/logger'
import validatorSchema from './constant/validator.json'

const ajv = new Ajv()

const validateSchema = (schema: object) => {
  const validate = ajv.compile(validatorSchema)
  const isValid = validate(schema)

  if (!isValid) {
    validate.errors?.forEach((error) => {
      if (error.keyword === 'minItems') {
        logger.error('The provided schema must have 1 route items at least')
        return
      }

      let location = 'root'
      if (error.instancePath === '') {
        location = 'root'
      }
      if (error.instancePath.includes('routes')) {
        location = 'routes item'
      }
      logger.error(`The provided schema ${error.message} of ${location}`)
      // console.log(error);
    })
    throw new Error('invalid schema is provided')
  }
}

export default validateSchema
