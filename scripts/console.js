/**
 * LND Engine REPL
 */
const repl = require('repl')

const { LndEngine } = require('../src')

// Set vars here for console
const LND_HOST = process.env.LND_HOST
const TLS_CERT_PATH = process.env.TLS_CERT_PATH
const MACAROON_PATH = process.env.MACAROON_PATH

const replServer = repl.start({
  prompt: 'LND (engine) > '
})

const engineOptions = {
  tlsCertPath: TLS_CERT_PATH,
  macaroonPath: MACAROON_PATH
}

replServer.context.LndEngine = LndEngine
replServer.context.Engine = new LndEngine(LND_HOST, engineOptions)
replServer.context.commands = Object.keys(replServer.context)
