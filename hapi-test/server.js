const Hapi = require('hapi')
const Inert = require('inert')
const server = Hapi.Server({ port: 2345 })
const init = async () => {
  await server.register(Inert)
  server.route({
    path: '/',
    method: 'GET',
    handler: (req, h) => ({ message: 'Hello Hapi.js' })
  })
  await server.start()
}

server.route({
  path: '/upload',
  method: 'POST',
  handler: (req, h) => {
    const { payload } = req
    return payload
  }
})

init()
