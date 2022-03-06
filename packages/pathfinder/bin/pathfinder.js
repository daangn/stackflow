#!/usr/bin/env node

'use strict'

import { pathfinder } from '../lib/index.mjs'

// ;(() => {
//   const options = process.argv.slice(2)
//
//   const shouldInit = options.includes('init')
//   const shouldGenerate = options.includes('generate')
//
//   if (shouldInit) {
//     init()
//     return
//   } else if (shouldGenerate) {
//     generate(options)
//     return
//   }
//   const RED = '\x1b[31m'
//   const GREEN = '\x1b[32m'
//   const RESET = '\x1b[0m'
//   console.log(`${RED}%s${RESET}`, 'ERROR:', 'You should execute next command:')
//   console.log(`${GREEN}%s${RESET}`, 'INFO:', '$ pathfinder init')
//   console.log('OR')
//   console.log(`${GREEN}%s${RESET}`, 'INFO:', '$ pathfinder generate')
// })()

pathfinder()
