import { absolute } from 'ethical-utility-path'
import { onExit } from 'ethical-utility-process-exit'
import startServer from './manager.js'

const state = {
    destroyServer: undefined,
    onExitHook: undefined
}

const serverManager = async (ctx, next, config) => {

    const { path } = config

    if (state.destroyServer) {
        await state.onExitHook()
    }

    const file = absolute(path)
    const onError = async (e) => {
        console.error(e)
        delete state.destroyServer
    }

    try {
        state.destroyServer = await startServer({ file, onError })
    } catch (e) {
        console.error(e)
    }

    if (state.onExitHook) {
        return await next()
    }

    state.onExitHook = async () => {
        if (state.destroyServer) {
            try {
                await state.destroyServer()
            } catch (e) {
                console.error(e)
            }
            delete state.destroyServer
        }
    }

    onExit(state.onExitHook)

    await next()
}

const serverManagerInit = (config = {}) => (
    async (ctx, next) => (
        await serverManager(ctx, next, config)
    )
)

export default serverManagerInit
