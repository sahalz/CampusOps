import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import process from 'node:process'

const host = '127.0.0.1'
const requiredPorts = [
  { port: 4174, label: 'backend API' },
  { port: 5173, label: 'frontend app' },
]

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

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer()

    server.once('error', () => {
      resolve(false)
    })

    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port, host)
  })
}

const busyPorts = []
for (const requiredPort of requiredPorts) {
  if (!(await isPortAvailable(requiredPort.port))) {
    busyPorts.push(requiredPort)
  }
}

if (busyPorts.length > 0) {
  console.error('CampusOps dev server is already running or a required port is in use.')
  busyPorts.forEach(({ port, label }) => {
    console.error(`- ${label}: http://${host}:${port}/`)
  })
  console.error('Open the existing URL, or stop the old dev server before running npm run dev again.')
  process.exit(1)
}

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
