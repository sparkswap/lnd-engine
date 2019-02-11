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
const describeGraph = require('./describe-graph')
const sendToRoute = require('./send-to-route')
const updateChannelPolicy = require('./update-channel-policy')
const queryRoutes = require('./query-routes')
const subscribeInvoices = require('./subscribe-invoices')
const listPendingChannels = require('./list-pending-channels')
const closeChannel = require('./close-channel')
const sendCoins = require('./send-coins')
const genSeed = require('./gen-seed')
const initWallet = require('./init-wallet')
const unlockWallet = require('./unlock-wallet')
const listPayments = require('./list-payments')
const lookupPaymentStatus = require('./lookup-payment-status')
const listClosedChannels = require('./list-closed-channels')

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
  describeGraph,
  sendToRoute,
  updateChannelPolicy,
  queryRoutes,
  subscribeInvoices,
  listPendingChannels,
  closeChannel,
  sendCoins,
  genSeed,
  initWallet,
  unlockWallet,
  listPayments,
  lookupPaymentStatus,
  listClosedChannels
}
