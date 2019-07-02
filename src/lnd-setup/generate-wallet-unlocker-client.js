/**
 * Wallet Unlocker Client Module
 * @module src/lnd-setup/generate-wallet-unlocker-client
 */

/** @typedef {import('.').LndWalletUnlockerClient} WalletUnlocker */

const grpc = require('grpc')
const loadProto = require('../utils/load-proto')
const fs = require('fs')

/**
 * Array of lnd proto files to load to generate wallet unlocker
 * @type {ReadonlyArray<string>}
 */
const PROTO_FILES = Object.freeze(['rpc.proto'])

/**
 * Generates a lnrpc.WalletUnlocker client which is only used on initialization of the LND
 * node.
 *
 * @param {Object} args
 * @param {string} args.host
 * @param {string} args.protoPath
 * @param {string} args.tlsCertPath
 * @returns {WalletUnlocker}
 */
function generateWalletUnlockerClient ({ host, protoPath, tlsCertPath }) {
  const { lnrpc } = loadProto(protoPath, PROTO_FILES)

  if (!fs.existsSync(tlsCertPath)) {
    throw new Error(`LND-ENGINE error - tls cert file not found at path: ${tlsCertPath}`)
  }

  const tls = fs.readFileSync(tlsCertPath)
  const tlsCredentials = grpc.credentials.createSsl(tls)

  return new lnrpc.WalletUnlocker(host, tlsCredentials)
}

module.exports = generateWalletUnlockerClient
