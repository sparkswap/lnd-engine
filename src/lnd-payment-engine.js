const path = require('path')
const grpc = require('grpc')
const { readFileSync } = require('fs')
const RPCPATH = path.resolve('./proto/lnd-rpc.proto')
const debug = () => {}

class LNPaymentDriver {
  // TODO: figure out why we need baseSymbol or counterSymbol (which would be application)
  constructor ({ baseSymbol, counterSymbol, tlsPath, macaroonPath, rpcHost }) {
    this.baseSymbol = baseSymbol
    this.counterSymbol = counterSymbol
    this._routes = {}

    this.rpc = this._constructRpc({ tlsPath, macaroonPath, rpcHost })
  }

  _constructRpc ({ tlsPath, macaroonPath, rpcHost }) {
    const lnrpcDescriptor = grpc.load(RPCPATH)
    const lnrpc = lnrpcDescriptor.lnrpc
    const service = lnrpc.Lightning.service
    const credentials = this._buildCredentials({ tlsPath, macaroonPath })

    let rpc = new lnrpc.Lightning(rpcHost, credentials)

    Object.keys(service).forEach(name => {
      if (!service[name].requestStream && !service[name].responseStream) {
        rpc[`_${name}`] = rpc[name]

        rpc[name] = (...args) => {
          // debug(`Calling ${name} RPC`, ...args)
          // return new Promise((resolve, reject) => {
          //   rpc[`_${name}`].apply(rpc, [...args, (err, res) => {
          //     debug(`Response from ${name} RPC`, res)
          //     if (err) return reject(err)
          //     resolve(res)
          //   }])
          // })
        }
      }

      // Turns stream-based RPC calls into simpler batch-based ones
      // with promises
      if (service[name].requestStream && service[name].responseStream) {
        rpc[`_${name}`] = rpc[name]

        rpc[name] = (dataArr) => {
          debug(`Calling ${name} streaming RPC`, ...dataArr)

          let response = []

          if (!dataArr || !Array.isArray(dataArr)) {
            throw new Error('Only arrays are valid data types on streaming RPC calls.')
          }

          return new Promise((resolve, reject) => {
            let call = rpc[`_${name}`](rpc)

            // I have no idea if this RPC is one for one, but it's a decent guess
            let responsesRemaining = dataArr.length

            call.on('data', (ret) => {
              debug(`Streaming repsonse from ${name} RPC`, ret)
              response.push(ret)

              responsesRemaining--

              if (responsesRemaining <= 0) {
                call.end()
              }
            })

            call.on('error', (err) => {
              debug(`Error in ${name} streaming RPC`, err)
              resolve = function () {}
              reject(err)
            })

            call.on('end', () => {
              debug(`Completed stream from ${name} RPC`)
              resolve(response)
            })

            debug(`Sending ${dataArr.length} messages to ${name} RPC`)
            dataArr.forEach((datum) => {
              call.write(datum)
            })
          })
        }
      }

      // TODO: responseStream with no requestStream
    })

    return rpc
  }

  _buildCredentials ({ tlsPath, macaroonPath }) {
    const lndCert = readFileSync(tlsPath)
    const sslCreds = grpc.credentials.createSsl(lndCert)

    let macaroonCreds = grpc.credentials.createFromMetadataGenerator((args, callback) => {
      const macaroon = readFileSync(macaroonPath)
      let metadata = new grpc.Metadata()
      metadata.add('macaroon', macaroon.toString('hex'))
      callback(null, metadata)
    })

    return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds)
  }

  get symbols () {
    return [this.baseSymbol, this.counterSymbol]
  }

  // TODO: input checking
  // TODO: change function signature since we don't use inbound and outbound?
  async generatePaymentInfo (inbound, outbound) {
    debug(`Generating payment info for ${outbound.amount} ${outbound.symbol} -> ${inbound.amount} ${inbound.symbol}`)

    const isReachable = await this._isReachable(inbound, outbound)

    if (isReachable) {
      const info = await this.rpc.getInfo({})
      const pubKey = info.identity_pubkey
      return this._payToFromPubKey(pubKey)
    }

    const activeChannels = []

    throw new Error(`Not enough capacity on ${activeChannels.length} active channels to support
      inbound ${inbound.symbol} ${inbound.amount} outbound ${outbound.symbol} ${outbound.amount}`)
  }

  // TODO: isReachable should check reachability to a particular node, not just generally
  async _isReachable (inbound, outbound) {
    const symbols = this.symbols

    if (!symbols.includes(inbound.symbol) || !symbols.includes(outbound.symbol)) {
      throw new Error(`Inbound and Outbound symbols must be one of ${symbols.join(', ')}`)
    }
    if (inbound.symbol === outbound.symbol) {
      throw new Error(`Inbound and Outbound symbols must be different`)
    }

    debug(`Finding active channels that can support ${outbound.amount} ${outbound.symbol} -> ${inbound.amount} ${inbound.symbol}`)
    // TODO: this is a very basic check that there is *some* inbound and outbound channel
    // that can support this transaction. It does not do any monitoring, so this information
    // may quickly become out of date, but it is at least a basic check
    const { channels } = await this.rpc.listChannels({})
    const activeChannels = channels.filter(channel => channel.active)
    let maxLocalBalance = 0
    let maxRemoteBalance = 0

    debug(`Found ${activeChannels.length} active channels out of ${channels.length} channels.`)

    // TODO: figure out which channels belong to which blockchain
    for (var i = 0; i < activeChannels.length; i++) {
      maxLocalBalance = Math.max(maxLocalBalance, activeChannels[i].local_balance)
      maxRemoteBalance = Math.max(maxRemoteBalance, activeChannels[i].remote_balance)
      if (maxLocalBalance >= outbound.amount && maxRemoteBalance >= inbound.amount) {
        debug(`Found sufficient capacity of ${maxLocalBalance} and ${maxRemoteBalance}`)
        return true
      }
    }

    return false
  }

  // TODO: formalize pattern of payment info. Use similar invoices as lightning?
  _payToFromPubKey (pubKey) {
    return `ln:${pubKey}`
  }

  _pubKeyFromPayTo (payTo) {
    if (payTo.slice(0, 3) !== 'ln:') {
      throw new Error(`Invalid \`payTo\` field ${payTo}`)
    }

    // TODO: check length
    return payTo.slice(3)
  }

  // TODO: input checking
  // TODO: multiple orders at the same price point so that if we can't find a route
  // (con) to fill this order, we can check others atuomatically
  async createSwapInvoice (order) {
    let { received } = this._swapValues(order)

    debug(`Creating invoice for ${order.orderId} with ${received.value} ${received.ticker}`)

    let invoice = await this.rpc.addInvoice({
      memo: `kinesis:${order.orderId}`,
      value: received.value,
      ticker: received.ticker
    })

    return invoice.r_hash.toString('hex')
  }

  async executeSwap (order, swapHash, payTo, valueSent, tickerSent, invoice) {
    let counterpartyPubKey = this._pubKeyFromPayTo(payTo)

    let routes = await this._findRoutes(counterpartyPubKey, valueSent, tickerSent)

    debug(`Sending over swap route for ${swapHash}`)

    let [ paymentResponse ] = await this.rpc.sendToRoute([{
      // although rpc.proto suggests that you can use `payment_hash_string` to pass a hex-encoded string
      // my experience shows that passing a buffer works, whereas passing a string does not
      payment_hash: Buffer.from(swapHash, 'hex'),
      routes: routes
    }])

    if (!paymentResponse) {
      throw new Error(`sendToRoute RPC returned no response.`)
    }

    if (paymentResponse.payment_error && paymentResponse.payment_error.length) {
      throw new Error(`Error while filling Invoice ${invoice}: ${paymentResponse.payment_error}`)
    }

    // Is this the right thing to return?
    return paymentResponse.payment_preimage
  }

  async _swapValues (order) {
    const scale = order.fillAmount / order.baseAmount
    const fillBaseAmount = order.fillAmount
    // blech
    const fillCounterAmount = Math.round(order.counterAmount * scale)

    let valueSent
    let valueReceived
    let tickerSent
    let tickerReceived

    // When we are creating an invoice, we are filling an order.
    // When the order is a BID, we are selling base.
    // When the order is a ASK, we are buying base.
    if (order.side === 'BID') {
      valueSent = fillBaseAmount
      tickerSent = this.baseSymbol
      valueReceived = fillCounterAmount
      tickerReceived = this.counterSymbol
    } else {
      valueSent = fillCounterAmount
      tickerSent = this.counterSymbol
      valueReceived = fillBaseAmount
      tickerReceived = this.baseSymbol
    }

    return {
      sent: {
        ticker: tickerSent,
        value: valueSent
      },
      received: {
        ticker: tickerReceived,
        value: valueReceived
      }
    }
  }

  async _findRoutes (counterpartyPubKey, inValue, inSymbol) {
    const symbols = this.symbols

    if (!symbols.includes(inSymbol)) {
      throw new Error(`\`inSymbol\` must be one of ${symbols.join(', ')}`)
    }

    const outSymbol = symbols[1 - symbols.indexOf(inSymbol)]

    debug(`Querying for swap routes through ${counterpartyPubKey} for in: ${inValue} ${inSymbol} out: ${outSymbol}`)

    let { routes } = await this.rpc.querySwapRoutes({
      pub_key: counterpartyPubKey,
      in_amt: inValue,
      in_ticker: inSymbol,
      out_ticker: outSymbol
    })

    if (!routes.length) {
      throw new Error(`No routes found for counterparty ${counterpartyPubKey}`)
    }

    return routes
  }
}

export default LNPaymentDriver
