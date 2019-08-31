const generateWalletUnlockerClient = require('./generate-wallet-unlocker-client')
const generateLightningClient = require('./generate-lightning-client')

/** @typedef {import('grpc').ClientReadableStream} ClientReadableStream */

/** @typedef {object} LndClient
 *  @property {(args: object, opts: object, cb: Function) => undefined} addInvoice
 *  @property {(args: object) => ClientReadableStream} closeChannel
 *  @property {(args: object, opts: object, cb: Function) => undefined} connectPeer
 *  @property {(args: object, opts: object, cb: Function) => undefined} decodePayReq
 *  @property {(args: object, opts: object, cb: Function) => undefined} describeGraph
 *  @property {(args: object, opts: object, cb: Function) => undefined} getInfo
 *  @property {(args: object, opts: object, cb: Function) => undefined} getTransactions
 *  @property {(args: object, opts: object, cb: Function) => undefined} listChannels
 *  @property {(args: object, opts: object, cb: Function) => undefined} closedChannels
 *  @property {(args: object, opts: object, cb: Function) => undefined} listInvoices
 *  @property {(args: object, opts: object, cb: Function) => undefined} listPayments
 *  @property {(args: object, opts: object, cb: Function) => undefined} listPeers
 *  @property {(args: object, opts: object, cb: Function) => undefined} pendingChannels
 *  @property {(args: object, opts: object, cb: Function) => undefined} lookupInvoice
 *  @property {(args: object, opts: object, cb: Function) => undefined} lookupPaymentStatus
 *  @property {(args: object, opts: object, cb: Function) => undefined} newAddress
 *  @property {(args: object, opts: object, cb: Function) => undefined} openChannelSync
 *  @property {(args: object, opts: object, cb: Function) => undefined} queryRoutes
 *  @property {(args: object, opts: object, cb: Function) => undefined} sendCoins
 *  @property {(args: object, opts: object, cb: Function) => undefined} sendPaymentSync
 *  @property {(args: object) => ClientReadableStream} sendToRoute
 *  @property {(args: object, cb: Function) => undefined} updateChannelPolicy
 *  @property {(args: object, opts: object, cb: Function) => undefined} walletBalance
 *  @property {object} invoices
 *  @property {(args: object) => ClientReadableStream} subscribeSingleInvoice
 *  @property {object} router
 *  @property {(args: object) => ClientReadableStream} trackPayment
 *  @property {() => void} close
 */

/** @typedef {object} LndWalletUnlockerClient
 *  @property {(args: object, opts: object, cb: Function) => undefined} genSeed
 *  @property {(args: object, opts: object, cb: Function) => undefined} initWallet
 *  @property {(args: object, opts: object, cb: Function) => undefined} unlockWallet
 *  @property {(args: object, opts: object, cb: Function) => undefined} changePassword
 *  @property {() => void} close
 */

module.exports = {
  generateWalletUnlockerClient,
  generateLightningClient
}
