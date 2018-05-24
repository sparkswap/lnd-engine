const invoices = require('./invoices')
const wallet = require('./wallet')
const health = require('./health')
const info = require('./info')
const balance = require('./balance')
const channels = require('./channels')
const peers = require('./peers')

module.exports = {
  invoices,
  wallet,
  info,
  balance,
  health,
  channels,
  peers
}
