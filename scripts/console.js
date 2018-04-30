/**
 * LND Engine REPL
 *
 * This script has two purposes:
 * 1. to duplicate rails console functionality
 * 2. to provide an example for how you can use LND Engine in your own applications
 *
 * It is recommended that you use environment variables to store configuration information for
 * the LND Engine library.
 *
 * You only need to set `engineOptions` if you are straying away from the provided defaults
 * which have been setup for you in the contained dockerfiles.
 *
 */
const repl = require('repl')

const { LndEngine } = require('../src')

// Set vars here for console
const LND_HOST = process.env.LND_HOST || 'lnd_btc:10009'
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || '/shared/lnd-engine-tls.cert'
const MACAROON_PATH = process.env.MACAROON_PATH || '/shared/lnd-engine-admin.macaroon'

const replServer = repl.start({
  prompt: 'LND (engine) > '
})

const engineOptions = {
  tlsCertPath: TLS_CERT_PATH, // overrides default
  macaroonPath: MACAROON_PATH // overrides default
}

replServer.context.LndEngine = LndEngine
replServer.context.Engine = new LndEngine(LND_HOST, engineOptions)
replServer.context.commands = Object.keys(replServer.context)
