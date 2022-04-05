import fs from 'fs'
import { program } from 'commander'

import init from './init'
import register from './register'
import generate from './genrerate'

const generateSecond = () => {
  const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  program
    .name('pathfinder')
    .description('generate route data from schema')
    .version(version)

  program.command('init').description('prepare initial settings').action(init)

  program
    .command('register')
    .description('register a schema to repository')
    .argument('<schemaPath>', 'path to load a schema')
    .option(
      '-y, --repository [path]',
      'indicate a repository path to preserve schemas'
    )
    .option('-d, --debug', 'option to print all messages')
    .action(async (schemaPath, options) => {
      await register(schemaPath, options)
    })

  program
    .command('generate')
    .description('generate sdk files from schema')
    .option('-s, --source [path]', 'json file defining schema')
    .option('-o, --output [path]', 'output to provided path')
    .option('-r, --replace [name]', 'replace generator function')
    .option('-u, --suffix [name]', 'name to describe result type')
    .option('-d, --debug', 'option to print all messages')
    .action(async (options) => {
      await generate(options)
    })

  program.parse()
}

export default generateSecond
