import { spawn } from 'node:child_process'
import process from 'node:process'

const commands = [
  {
    name: 'backend',
    command: 'npm',
    args: ['--prefix', 'backend', 'run', 'dev'],
  },
  {
    name: 'frontend',
    command: 'npm',
    args: ['--prefix', 'frontend', 'run', 'dev', '--', '--host', '127.0.0.1'],
  },
]

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
  })

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`)
  })

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${name}] ${data}`)
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code
      children.forEach((runningChild) => {
        if (runningChild.pid !== child.pid) {
          runningChild.kill('SIGTERM')
        }
      })
    }
  })

  return child
})

function stopAll() {
  children.forEach((child) => child.kill('SIGTERM'))
}

process.on('SIGINT', () => {
  stopAll()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopAll()
  process.exit(0)
})
