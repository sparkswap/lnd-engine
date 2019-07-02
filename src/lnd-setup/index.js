const generateWalletUnlockerClient = require('./generate-wallet-unlocker-client')
const generateLightningClient = require('./generate-lightning-client')

/** @typedef {import('grpc').ClientReadableStream} ClientReadableStream */

/** @typedef {Object} LndClient
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} addInvoice
 *  @property {(args: Object) => ClientReadableStream} closeChannel
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} connectPeer
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} decodePayReq
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} describeGraph
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} getInfo
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} getTransactions
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} listChannels
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} closedChannels
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} listInvoices
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} listPayments
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} listPeers
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} pendingChannels
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} lookupInvoice
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} lookupPaymentStatus
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} newAddress
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} openChannelSync
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} queryRoutes
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} sendCoins
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} sendPaymentSync
 *  @property {(args: Object) => ClientReadableStream} sendToRoute
 *  @property {(args: Object, cb: Function) => undefined} updateChannelPolicy
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} walletBalance
 *  @property {Object} invoices
 *  @property {(args: Object) => ClientReadableStream} subscribeSingleInvoice
 */

/** @typedef {Object} LndWalletUnlockerClient
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} genSeed
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} initWallet
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} unlockWallet
 *  @property {(args: Object, opts: Object, cb: Function) => undefined} changePassword
 */

module.exports = {
  generateWalletUnlockerClient,
  generateLightningClient
}
