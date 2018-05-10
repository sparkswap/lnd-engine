const fs = require('fs')

const { loadService } = require('./grpc-util')
const { generateCredentials } = require('./lnd-credentials')

const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

const operational = require('./operational')
const wallet = require('./wallet')

/**
 * Constructor for creating an interface to an LND Engine.
 *
 * @params {String} LND host ip
 * @params {Object} options
 * @params {Logger} options.logger - defaults to console
 * @params {Logger} options.tlsCertPath - defaults to TLS_CERT_PATH
 * @params {Logger} options.macaroonPath - defaults to MACAROON_PATH
 */
class LndEngine {
  constructor (host, { logger, tlsCertPath, macaroonPath } = {}) {
    // Defaults for the LND Engine are hardcoded below.
    //
    // These are variables are also set at build time in the services Dockerfile, so they are not
    // customizable (at the moment)
    //
    // TODO: Allow these variables to be configured through ENV
    this.hostName = 'lnd_btc'
    this.host = host || `${this.hostName}:10009`
    this.logger = logger || console
    this.tlsCertPath = tlsCertPath || '/shared/lnd-engine-tls.cert'
    this.macaroonPath = macaroonPath || '/shared/lnd-engine-admin.macaroon'
    this.protoPath = LND_PROTO_FILE_PATH
    this.credentials = generateCredentials(this.tlsCertPath, this.macaroonPath)

    // Apply Mixins
    Object.assign(this, operational)
    Object.assign(this, wallet)

    this.serviceOptions = {
      'grpc.ssl_target_name_override': this.hostName,
      'grpc.default_authority': this.hostName
    }

    if (!this.host) throw new Error('LND_ENGINE error: no host is specified')
    if (!fs.existsSync(this.protoPath)) throw new Error('LND-ENGINE error: Proto file not found')

    this.descriptor = loadService(LND_PROTO_FILE_PATH)
    this.LndRpc = this.descriptor.lnrpc
    this.lnd = new this.LndRpc.Lightning(this.host, this.credentials, this.serviceOptions)
  }
}

module.exports = LndEngine
