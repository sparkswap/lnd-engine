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

const LndEngine = require('../src')

const LND_HOST = process.env.LND_HOST
const TLS_CERT_PATH = process.env.TLS_CERT_PATH
const MACAROON_PATH = process.env.MACAROON_PATH

const replServer = repl.start({
  prompt: 'LND (engine) > '
})

const engineOptions = {
  tlsCertPath: TLS_CERT_PATH, // overrides default
  macaroonPath: MACAROON_PATH // overrides default
}

replServer.defineCommand('wtf', {
  help: 'Provides an introduction to usage patterns for the repl',
  action () {
    console.log(`You can access a predefined Engine (${LND_HOST}) by using the 'Engine' object:`)
    console.log('')
    console.log('EXAMPLE: `Engine.getInfo().then(res => console.log(res))`')
    console.log('')
    console.log('You also have access to the LND Constuctor where you can define your own engine')
    console.log('at a specified host.')
    console.log('')
    console.log('EXAMPLE: `const engine = new LndEngine(myHost, myOptions)`')
    console.log('')
    console.log('Please refer to documentation for constructor usages.')
    console.log('Please refer to ./scripts/console.js for repl implementation.')
    return this.displayPrompt()
  }
})

replServer.defineCommand('commands', {
  help: 'Provides a list of all available global variables',
  action () {
    console.log(Object.keys(this.context))
    return this.displayPrompt()
  }
})

replServer.context.LndEngine = LndEngine
replServer.context.Engine = new LndEngine(LND_HOST, engineOptions)
