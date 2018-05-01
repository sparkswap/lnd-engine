const fs = require('fs')

const { loadService } = require('./grpc-util')
const { generateCredentials } = require('./lnd-credentials')

const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

// Defaults for the LND Engine
// These are currently set at build time in the services Dockerfile, so they are not
// customizable at the moment, however as a TODO, we should allow this to be configured
// through ENV
//
// TODO: Allow this to be editable. This is related to how we generate
//   ssl certs for the lnd instances (see docker/)
const LND_HOST = 'lnd_btc:10009'
const TLS_CERT_PATH = '/shared/lnd-engine-tls.cert'
const MACAROON_PATH = '/shared/lnd-engine-admin.macaroon'
const SSL_TARGET = 'lnd_btc'

const operational = require('./operational')

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
    this.protoPath = LND_PROTO_FILE_PATH
    this.credentials = generateCredentials(this.tlsCertPath, this.macaroonPath)

    // Apply Mixins
    Object.assign(this, operational)

    this.serviceOptions = {
      'grpc.ssl_target_name_override': SSL_TARGET,
      'grpc.default_authority': SSL_TARGET
    }

    if (!this.host) throw new Error('LND_ENGINE error: no host is specified')
    if (!fs.existsSync(this.protoPath)) throw new Error('LND-ENGINE error: Proto file not found')

    this.descriptor = loadService(LND_PROTO_FILE_PATH)
    this.LndRpc = this.descriptor.lnrpc
    this.client = new this.LndRpc.Lightning(this.host, this.credentials, this.serviceOptions)
  }
}

module.exports = LndEngine
