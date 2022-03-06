import fs from 'fs'
import path from 'path'

import { INITIAL_SCHEMA, INITIAL_CONFIG } from './constant/initial'

const init = () => {
  fs.writeFileSync(path.resolve(`schema.json5`), INITIAL_SCHEMA, 'utf-8')
  fs.writeFileSync(path.resolve(`.pathfinderrc`), INITIAL_CONFIG, 'utf-8')
}

export default init
