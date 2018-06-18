const addInvoice = require('./add-invoice')
const connectPeer = require('./connect-peer')
const getInfo = require('./get-info')
const listInvoices = require('./list-invoices')
const listPeers = require('./list-peers')
const lookupInvoice = require('./lookup-invoice')
const newAddress = require('./new-address')
const openChannel = require('./open-channel')
const walletBalance = require('./wallet-balance')
const decodePaymentRequest = require('./decode-payment-request')
const listChannels = require('./list-channels')
const sendPayment = require('./send-payment')
const updateChannelPolicy = require('./update-channel-policy')
const getChanInfo = require('./get-chan-info')

module.exports = {
  addInvoice,
  connectPeer,
  getInfo,
  listInvoices,
  listPeers,
  lookupInvoice,
  newAddress,
  openChannel,
  walletBalance,
  decodePaymentRequest,
  listChannels,
  sendPayment,
  updateChannelPolicy,
  getChanInfo
}
