const addInvoice = require('./add-invoice')
const getInfo = require('./get-info')
const invoiceStatus = require('./invoice-status')
const newAddress = require('./new-address')
const walletBalance = require('./wallet-balance')

module.exports = {
  addInvoice,
  getInfo,
  invoiceStatus,
  newAddress,
  walletBalance
}
