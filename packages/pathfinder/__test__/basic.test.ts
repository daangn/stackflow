import { ChildProcessWithoutNullStreams, spawn, exec } from 'child_process'
import fs from 'fs'
import path from 'path'

const debug = (child: ChildProcessWithoutNullStreams) => {
  child.on('message', (msg) => {
    console.log('msg: ', msg)
  })
  child.on('error', (error) => {
    console.log('child process error: ', error)
  })
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (data) => {
    console.log('stderr data: ', data)
  })
  child.stdout.setEncoding('utf8')
  child.stdout.on('error', (error) => {
    console.log('stdout error: ', error)
  })
  child.stdout.on('end', () => {
    console.log('stdout end: ')
  })
  child.stdout.on('close', () => {
    console.log('stdout close: ')
  })
}

describe('pathfinder:', () => {
  beforeAll(() => {
    exec('yarn build')
  })

  it.skip('아무 명령어도 입력하지 않으면, 에러 메시지와 함께 사용가능한 명령어를 안내한다.', (done) => {
    const child = spawn('yarn pathfinder', [], { shell: true })

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (data) => {
      expect(data).toContain('Usage: pathfinder')
      done()
    })
  })

  it('init 명령어를 입력하면 .pathfinderrc 파일과 schema.json5 파일을 생성한다.', (done) => {
    const schemaPath = path.resolve('./schema.json5')
    const configPath = path.resolve('./.pathfinderrc')

    try {
      // when
      const child = spawn('yarn pathfinder', ['init'], { shell: true })

      // FIXME: why stdout close event?
      child.stdout.on('close', () => {
        try {
          const hasSchema = fs.existsSync(schemaPath)
          const hasConfig = fs.existsSync(configPath)

          // then
          expect(hasSchema).toBeTruthy()
          expect(hasConfig).toBeTruthy()

          // teardown
          fs.rmSync(schemaPath)
          fs.rmSync(configPath)

          done()
        } catch (e) {
          // teardown
          if (fs.existsSync(schemaPath)) {
            fs.rmSync(schemaPath)
          }
          if (fs.existsSync(configPath)) {
            fs.rmSync(configPath)
          }

          throw e
        }
      })
    } catch (e) {
      // teardown
      if (fs.existsSync(schemaPath)) {
        fs.rmSync(schemaPath)
      }
      if (fs.existsSync(configPath)) {
        fs.rmSync(configPath)
      }

      throw e
    }
  })

  it('schema 위치를 설정하지 않고 generate 하면 에러 메시지를 출력한다.', (done) => {
    const child = spawn('yarn pathfinder', ['generate'], { shell: true })

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (data) => {
      expect(data).toContain('Any json file can not be detected')
      done()
    })
  })

  it.skip('schema 가 json 파일 형태를 가지고 json5 처럼 주석을 사용하면 에러 메시지를 출력한다.', (done) => {
    try {
      fs.writeFileSync(
        path.resolve(`schema.json`),
        `{ "foo": "bar" // comment }`,
        'utf-8'
      )
      const child = spawn(
        'yarn pathfinder',
        ['generate', '-s', 'schema.json'],
        { shell: true }
      )

      child.stdout.setEncoding('utf8')
      child.stdout.on('data', (data) => {
        try {
          expect(data).toContain(
            'You should use JSON5 instead of plain JSON if you would like to use comment in schema'
          )

          // teardown
          fs.rmSync(path.resolve('./schema.json'))
          done()
        } catch (e) {
          if (fs.existsSync(path.resolve('./schema.json'))) {
            fs.rmSync(path.resolve('./schema.json'))
          }
          throw e
        }
      })
    } catch (e) {
      // teardown
      if (fs.existsSync(path.resolve('./schema.json'))) {
        fs.rmSync(path.resolve('./schema.json'))
      }
      throw e
    }
  })
})
