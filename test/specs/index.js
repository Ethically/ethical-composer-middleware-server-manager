import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'
import { exit } from 'ethical-utility-process-exit'
import serverManager from '../../src/index.js'


const baseURL = 'http://localhost:8080'
const distFile = join('test', 'files', 'dist')
const errorFile = join(distFile, 'error.js')
const serverFile = join(distFile, 'server.js')
const startUpErrorFile = join(distFile, 'startup-error.js')
const shutdownErrorFile = join(distFile, 'shutdown-error.js')
const ctx = {}
const next = () => {}
const processExit = process.exit
const disableExit = () => process.exit = () => {}
const enableExit = () => process.exit = processExit
const defaultBody = '{{ DEFAULT_BODY }}'

describe('serverManager()', () => {
    beforeEach(() => disableExit())
    afterEach(() => enableExit())
    it('should start server', async (done) => {
        const config = { path: serverFile }
        await serverManager(config)(ctx, next)
        const response = await fetch(baseURL)
        const text = await response.text()
        expect(text).toBe(defaultBody)
        await exit()
        done()
    })
    it('should handle startup server error', async (done) => {
        const consoleError = console.error
        console.error = (e) => {
            expect(e.message).toBe('Server stopped unexpectedly on startup!')
            console.error = consoleError
            setTimeout(done, 0)
        }
        const config = { path: startUpErrorFile }
        await serverManager(config)(ctx, next)
    })
    it('should handle server error', async (done) => {
        const consoleError = console.error
        console.error = (e) => {
            expect(e.message).toBe('Server stopped unexpectedly!')
            console.error = consoleError
            setTimeout(done, 0)
        }
        const config = { path: errorFile }
        await serverManager(config)(ctx, next)
    })
    it('should handle shutdown server error', async (done) => {
        const consoleError = console.error
        console.error = (e) => {
            expect(e.message).toBe('Server stopped unexpectedly on shutdown!')
            console.error = consoleError
            setTimeout(done, 0)
        }
        const config = { path: shutdownErrorFile }
        await serverManager(config)(ctx, next)
        await exit()
    })
    it('should restart server', async (done) => {
        const config = { path: serverFile }
        await serverManager(config)(ctx, next)
        const response = await fetch(baseURL)
        const text = await response.text()
        expect(text).toBe(defaultBody)
        const file = readFileSync(serverFile, 'utf8')
        const modifiedBody = 'Modified Body!'
        const newFile = file.replace(defaultBody, modifiedBody)
        writeFileSync(serverFile, newFile)
        await serverManager(config)(ctx, next)
        const modifiedResponse = await fetch(baseURL)
        const modifiedText = await modifiedResponse.text()
        expect(modifiedText).toBe(modifiedBody)
        await exit()
        writeFileSync(serverFile, file)
        done()
    })
    it('should handle multiple exit events', async (done) => {
        const config = { path: serverFile }
        await serverManager(config)(ctx, next)
        const response = await fetch(baseURL)
        const text = await response.text()
        expect(text).toBe(defaultBody)
        await exit()
        await exit()
        await exit()
        done()
    })
})
