const getInvoices = require('./get-invoices')
const getPublicKey = require('./get-public-key')
const getTotalBalance = require('./get-total-balance')
const getConfirmedBalance = require('./get-confirmed-balance')
const getUnconfirmedBalance = require('./get-unconfirmed-balance')
const getPeers = require('./get-peers')
const createChannel = require('./create-channel')
const createInvoice = require('./create-invoice')
const createNewAddress = require('./create-new-address')
const createSwapHash = require('./create-swap-hash')
const isAvailable = require('./is-available')
const isInvoicePaid = require('./is-invoice-paid')
const getPaymentRequestDetails = require('./get-payment-request-details')
const isBalanceSufficient = require('./is-balance-sufficient')
const payInvoice = require('./pay-invoice')

module.exports = {
  getInvoices,
  getPublicKey,
  isAvailable,
  getTotalBalance,
  getConfirmedBalance,
  getUnconfirmedBalance,
  createChannel,
  createInvoice,
  getPeers,
  createNewAddress,
  isInvoicePaid,
  getPaymentRequestDetails,
  isBalanceSufficient,
  createSwapHash,
  payInvoice
}
