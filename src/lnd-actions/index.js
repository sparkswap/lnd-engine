const addInvoice = require('./add-invoice')
const connectPeer = require('./connect-peer')
const getInfo = require('./get-info')
const listInvoices = require('./list-invoices')
const lookupInvoice = require('./lookup-invoice')
const newAddress = require('./new-address')
const openChannel = require('./open-channel')
const walletBalance = require('./wallet-balance')

module.exports = {
  addInvoice,
  connectPeer,
  getInfo,
  listInvoices,
  lookupInvoice,
  newAddress,
  openChannel,
  walletBalance
}
