import { exit } from 'ethical-utility-process-exit'

const localState = { destroyServer: null }

const manageServer = async ({ action, file }) => {

    if (action === 'SERVER_START') {
        try {
            const { default: server } = require(file)
            const instance = await server
            localState.destroyServer = instance
        } catch (e) {
            console.error(e)
            exit(1)
        }
        process.send({ action: 'SERVER_STARTED' })
    }

    if (action === 'SERVER_STOP') {
        await localState.destroyServer()
        exit()
    }
}

process.on('message', manageServer)
