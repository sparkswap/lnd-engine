const getInvoices = require('./get-invoices')
const getPublicKey = require('./get-public-key')
const getTotalBalance = require('./get-total-balance')
const getConfirmedBalance = require('./get-confirmed-balance')
const getUnconfirmedBalance = require('./get-unconfirmed-balance')
const getPeers = require('./get-peers')
const getInvoiceValue = require('./get-invoice-value')
const createChannel = require('./create-channel')
const createInvoice = require('./create-invoice')
const createNewAddress = require('./create-new-address')
const createSwapHash = require('./create-swap-hash')
const isAvailable = require('./is-available')
const isInvoicePaid = require('./is-invoice-paid')
const isBalanceSufficient = require('./is-balance-sufficient')
const payInvoice = require('./pay-invoice')

module.exports = {
  getInvoices,
  getPublicKey,
  getTotalBalance,
  getConfirmedBalance,
  getUnconfirmedBalance,
  getPeers,
  getInvoiceValue,
  createChannel,
  createInvoice,
  createNewAddress,
  createSwapHash,
  isAvailable,
  isInvoicePaid,
  isBalanceSufficient,
  payInvoice
}
