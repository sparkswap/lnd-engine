const path = require('path')
const fs = require('fs')

const { loadService } = require('./grpc-util')
const { generateCredentials } = require('./lnd-credentials')

const { LND_HOST, TLS_CERT_PATH, MACAROON_PATH } = process.env

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
    this.host = host || LND_HOST
    this.logger = logger || console
    this.tlsCertPath = tlsCertPath || TLS_CERT_PATH
    this.macaroonPath = macaroonPath || MACAROON_PATH
    this.protoPath = path.resolve('./proto/lnd-rpc.proto')
    this.credentials = generateCredentials(this.tlsCertPath, this.macaroonPath)

    // TODO: Allow this to be editable. This is related to how we generate
    //   ssl certs for the lnd instances (see docker/)
    this.serviceOptions = {
      'grpc.ssl_target_name_override': 'lnd_btc',
      'grpc.default_authority': 'lnd_btc'
    }

    if (!this.host) throw new Error('LND_ENGINE error: no host is specified')
    if (!fs.existsSync(this.protoPath)) throw new Error('LND-ENGINE error: Proto file not found')

    this.descriptor = loadService(this.protoPath)
    this.LndRpc = this.descriptor.lnrpc
    this.client = new this.LndRpc.Lightning(this.host, this.credentials, this.serviceOptions)
  }
}

module.exports = LndEngine
