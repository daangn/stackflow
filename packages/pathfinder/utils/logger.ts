const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

const logger = {
  error: (message: string) => {
    console.log(`${RED}%s${RESET}`, 'ERROR:', message)
  },
  warn: (message: string) => {
    console.log(`${YELLOW}%s${RESET}`, 'WARN:', message)
  },
  info: (message: string) => {
    console.log(`${GREEN}%s${RESET}`, 'INFO:', message)
  },
  log: (message: string) => {
    console.log('LOG ', message)
  },
}

export default logger
