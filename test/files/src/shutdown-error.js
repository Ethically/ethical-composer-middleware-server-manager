import ethicalServer from 'ethical-utility-server'

export default (
    ethicalServer()
    .use(ctx => ctx.body = '{{ DEFAULT_BODY }}')
    .listen()
    .then(destroyServer => async () => {
        await destroyServer()
        process.exit(1)
    })
)
