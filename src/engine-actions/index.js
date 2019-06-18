const getInvoices = require('./get-invoices')
const getPublicKey = require('./get-public-key')
const getUncommittedBalance = require('./get-uncommitted-balance')
const getConfirmedBalance = require('./get-confirmed-balance')
const getUnconfirmedBalance = require('./get-unconfirmed-balance')
const getInvoiceValue = require('./get-invoice-value')
const getTotalChannelBalance = require('./get-total-channel-balance')
const createChannels = require('./create-channels')
const createInvoice = require('./create-invoice')
const createNewAddress = require('./create-new-address')
const createSwapHash = require('./create-swap-hash')
const isInvoicePaid = require('./is-invoice-paid')
const isBalanceSufficient = require('./is-balance-sufficient')
const payInvoice = require('./pay-invoice')
const prepareSwap = require('./prepare-swap')
const executeSwap = require('./execute-swap')
const createRefundInvoice = require('./create-refund-invoice')
const getPaymentChannelNetworkAddress = require('./get-payment-channel-network-address')
const translateSwap = require('./translate-swap')
const getSettledSwapPreimage = require('./get-settled-swap-preimage')
const numChannelsForAddress = require('./num-channels-for-address')
const getTotalPendingChannelBalance = require('./get-total-pending-channel-balance')
const getUncommittedPendingBalance = require('./get-uncommitted-pending-balance')
const getPendingChannelCapacities = require('./get-pending-channel-capacities')
const getOpenChannelCapacities = require('./get-open-channel-capacities')
const closeChannels = require('./close-channels')
const getMaxChannel = require('./get-max-channel')
const withdrawFunds = require('./withdraw-funds')
const createWallet = require('./create-wallet')
const unlockWallet = require('./unlock-wallet')
const getPaymentPreimage = require('./get-payment-preimage')
const isPaymentPendingOrComplete = require('./is-payment-pending-or-complete')
const getStatus = require('./get-status')
const getChannels = require('./get-channels')
const getTotalReservedChannelBalance = require('./get-total-reserved-channel-balance')
const getMaxChannelForAddress = require('./get-max-channel-for-address')
const getChannelsForRemoteAddress = require('./get-channels-for-remote-address')
const connectUser = require('./connect-user')
const getPeers = require('./get-peers')
const getChainTransactions = require('./get-chain-transactions')
const changeWalletPassword = require('./change-wallet-password')
const getTotalBalanceForAddress = require('./get-total-balance-for-address')
const recoverWallet = require('./recover-wallet')

module.exports = {
  validationDependentActions: {
    getInvoices,
    getPublicKey,
    getUncommittedBalance,
    getConfirmedBalance,
    getUnconfirmedBalance,
    getInvoiceValue,
    getTotalChannelBalance,
    createChannels,
    createInvoice,
    createNewAddress,
    createSwapHash,
    isInvoicePaid,
    isBalanceSufficient,
    payInvoice,
    prepareSwap,
    executeSwap,
    createRefundInvoice,
    getPaymentChannelNetworkAddress,
    translateSwap,
    getSettledSwapPreimage,
    numChannelsForAddress,
    getTotalPendingChannelBalance,
    getUncommittedPendingBalance,
    getPendingChannelCapacities,
    getOpenChannelCapacities,
    closeChannels,
    getMaxChannel,
    withdrawFunds,
    getPaymentPreimage,
    isPaymentPendingOrComplete,
    getChannels,
    getTotalReservedChannelBalance,
    getMaxChannelForAddress,
    getChannelsForRemoteAddress,
    connectUser,
    getPeers,
    getChainTransactions,
    getTotalBalanceForAddress
  },
  validationIndependentActions: {
    createWallet,
    recoverWallet,
    getStatus,
    unlockWallet,
    changeWalletPassword
  }
}
