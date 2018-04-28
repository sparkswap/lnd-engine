/**
 * LND Engine REPL
 */
const repl = require('repl')

const { LndEngine } = require('../src')

// Set vars here for console
const LND_HOST = process.env.LND_HOST || 'localhost:10009'
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || '/secure/tls.cert'
const MACAROON_PATH = process.env.MACAROON_PATH || '/secure/admin.macaroon'

const replServer = repl.start({
  prompt: 'LND (engine) > '
})

const engineOptions = {
  tlsCertPath: TLS_CERT_PATH,
  macaroonPath: MACAROON_PATH
}

replServer.context.Engine = new LndEngine(LND_HOST, engineOptions)
replServer.context.commands = Object.keys(replServer.context)
