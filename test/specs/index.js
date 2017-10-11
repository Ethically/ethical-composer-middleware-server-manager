import { expect } from 'chai'
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

    it('should start server', async () => {
        const config = { path: serverFile }
        await serverManager(config)(ctx, next)
        const response = await fetch(baseURL)
        const text = await response.text()
        expect(text).to.equal(defaultBody)
        await exit()
    })

    it('should handle startup server error', (done) => {
        const consoleError = console.error
        console.error = (e) => {
            expect(e.message).to.equal('Server stopped unexpectedly on startup!')
            console.error = consoleError
            setTimeout(done, 0)
        }
        const config = { path: startUpErrorFile }
        serverManager(config)(ctx, next)
    })

    it('should handle server error', (done) => {
        const consoleError = console.error
        console.error = (e) => {
            expect(e.message).to.equal('Server stopped unexpectedly!')
            console.error = consoleError
            setTimeout(done, 0)
        }
        const config = { path: errorFile }
        serverManager(config)(ctx, next)
    })

    it('should handle shutdown server error', async () => {
        const consoleError = console.error
        let promise
        console.error = (e) => {
            expect(e.message).to.equal('Server stopped unexpectedly on shutdown!')
            console.error = consoleError
            promise = new Promise(resolve => setTimeout(resolve, 0))

        }
        const config = { path: shutdownErrorFile }
        await serverManager(config)(ctx, next)
        await promise
        await exit()
    })

    it('should restart server', async () => {
        const config = { path: serverFile }
        await serverManager(config)(ctx, next)
        const response = await fetch(baseURL)
        const text = await response.text()
        expect(text).to.equal(defaultBody)
        const file = readFileSync(serverFile, 'utf8')
        const modifiedBody = 'Modified Body!'
        const newFile = file.replace(defaultBody, modifiedBody)
        writeFileSync(serverFile, newFile)
        await serverManager(config)(ctx, next)
        const modifiedResponse = await fetch(baseURL)
        const modifiedText = await modifiedResponse.text()
        expect(modifiedText).to.equal(modifiedBody)
        await exit()
        writeFileSync(serverFile, file)
    })
    .timeout(5000)

    it('should handle multiple exit events', async () => {
        const config = { path: serverFile }
        await serverManager(config)(ctx, next)
        const response = await fetch(baseURL)
        const text = await response.text()
        expect(text).to.equal(defaultBody)
        await exit()
        await exit()
        await exit()
    })
})
