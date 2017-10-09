import { fork } from 'child_process'
import { join } from 'path'

const startServer = ({ file, onError }) => (
    new Promise((resolve, reject) => {
        const startupError = (code) => {
            reject(new Error('Server stopped unexpectedly on startup!'))
        }
        const server = fork( join( process.cwd(), 'dist', 'server.js' ) )
        server.on('close', startupError)
        server.on('message', () => {
            const unexpectedError = () => {
                onError(new Error('Server stopped unexpectedly!'))
            }
            server.on('close', unexpectedError)
            server.removeListener('close', startupError)
            resolve(stopServer(server, unexpectedError))
        })
        server.send({ action: 'SERVER_START', file })
    })
)

const stopServer = (server, unexpectedError) => () => (
    new Promise((resolve, reject) => {
        const shutdown = (code) => {
            if (code === 0) {
                return resolve()
            }
            reject(new Error('Server stopped unexpectedly on shutdown!'))
        }
        server.on('close', shutdown)
        server.removeListener('close', unexpectedError)
        server.send({ action: 'SERVER_STOP' })
    })
)

const startServerInit = (config) => startServer(config)

export default startServerInit
