import fs from 'fs'
import { program } from 'commander'

import init from './init'
import generate from './genrerate'

const generateSecond = () => {
  const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  program
    .name('pathfinder')
    .description('generate route data from schema')
    .version(version)

  program.command('init').description('prepare initial settings').action(init)

  program
    .command('generate')
    .description('generate sdk files from schema')
    .option('-s, --source [path]', 'json file defining schema')
    .option('-o, --output [path]', 'output to provided path')
    .option('-d, --debug', 'option to print all messages')
    .option('-r, --replace [name]', 'replace generator function')
    .action(async (options) => {
      await generate(options)
    })

  program.parse()
}

export default generateSecond
