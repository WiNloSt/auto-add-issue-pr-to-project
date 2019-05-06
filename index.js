const { createProbot } = require('probot')
const app = require('./app')

const loadProbot = app => {
  const probot = createProbot({
    id: process.env.APP_ID,
    cert: Buffer.from(process.env.PRIVATE_KEY, 'base64'),
    secret: process.env.WEBHOOK_SECRET
  })

  probot.load(app)

  return probot
}

module.exports = (req, res) => {
  const probot = loadProbot(app)
  return probot.server(req, res)
}
