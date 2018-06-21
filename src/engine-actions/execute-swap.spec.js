const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const executeSwap = rewire(path.resolve(__dirname, 'execute-swap'))

describe('execute-swap', () => {
  describe('routeFromPath', () => {
    let routeFromPath
    let inboundAmount
    let outboundAmount
    let counterpartyPosition
    let blockHeight
    let finalCLTVDelta
    let path

    beforeEach(() => {
      routeFromPath = executeSwap.__get__('routeFromPath')

      counterpartyPosition = 1
      outboundAmount = '1000000'
      inboundAmount = '500000'
      blockHeight = 5000
      finalCLTVDelta = 9
      path = [
        {
          fromPubKey: 'mypub',
          toPubKey: 'theirpub',
          channelId: '1234',
          capacity: '10000008',
          policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7',
            timeLockDelta: 100
          }
        },
        {
          fromPubKey: 'theirpub',
          toPubKey: 'counterpub',
          channelId: '4321',
          capacity: '20000000',
          policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7',
            timeLockDelta: 100
          }
        },
        {
          fromPubKey: 'counterpub',
          toPubKey: 'anotherpub',
          channelId: '6789',
          capacity: '20000000',
          policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '6',
            timeLockDelta: 100
          }
        },
        {
          fromPubKey: 'anotherpub',
          toPubKey: 'mypub',
          channelId: '9876',
          capacity: '20000000',
          policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '6',
            timeLockDelta: 100
          }
        }
      ]
    })

    it('calculates the total time lock', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route).to.have.property('totalTimeLock', 5313)
    })

    it('calculates the total time lock for diverse policies', () => {
      path[0].policy.timeLockDelta = 50

      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route).to.have.property('totalTimeLock', 5263)
    })

    it('calculates the total fees', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route).to.have.property('totalFeesMsat', '12000')
    })

    it('calculates the total amount to send', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route).to.have.property('totalAmtMsat', '1000008000')
    })

    it('constructs hops', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route).to.have.property('hops')
      expect(route.hops).to.be.an('array')
      expect(route.hops).to.have.lengthOf(4)
    })

    it('includes channel id in the hop', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route.hops[0]).to.have.property('chanId', '1234')
      expect(route.hops[1]).to.have.property('chanId', '4321')
      expect(route.hops[2]).to.have.property('chanId', '6789')
      expect(route.hops[3]).to.have.property('chanId', '9876')
    })

    it('includes channel capacity in the hop', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route.hops[0]).to.have.property('chanCapacity', '10000008')
      expect(route.hops[1]).to.have.property('chanCapacity', '20000000')
    })

    it('includes expiry in the hop', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route.hops[0]).to.have.property('expiry', 5212)
      expect(route.hops[1]).to.have.property('expiry', 5111)
      expect(route.hops[2]).to.have.property('expiry', 5010)
      expect(route.hops[3]).to.have.property('expiry', 5010)
    })

    it('includes expiry for diverse policies', () => {
      path[1].policy.timeLockDelta = 50
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route.hops[0]).to.have.property('expiry', 5162)
      expect(route.hops[1]).to.have.property('expiry', 5111)
      expect(route.hops[2]).to.have.property('expiry', 5010)
      expect(route.hops[3]).to.have.property('expiry', 5010)
    })

    it('includes the amount to forward in the hop', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route.hops[0]).to.have.property('amtToForwardMsat', '1000000000')
      expect(route.hops[1]).to.have.property('amtToForwardMsat', '500004000')
      expect(route.hops[2]).to.have.property('amtToForwardMsat', '500000000')
      expect(route.hops[3]).to.have.property('amtToForwardMsat', '500000000')
    })

    it('includes the fee in the hop', () => {
      const route = routeFromPath(inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount)

      expect(route.hops[0]).to.have.property('feeMsat', '8000')
      expect(route.hops[1]).to.have.property('feeMsat', '0')
      expect(route.hops[2]).to.have.property('feeMsat', '4000')
      expect(route.hops[3]).to.have.property('feeMsat', '0')
    })
  })

  describe('computeFee', () => {
    let computeFee
    let amount
    let policy

    beforeEach(() => {
      computeFee = executeSwap.__get__('computeFee')

      amount = '1000000'
      policy = {
        feeBaseMsat: '1000',
        feeRateMilliMsat: '1000'
      }
    })

    it('computes the fee', () => {
      const fee = computeFee(amount, policy)

      expect(fee).to.be.eql('2000')
    })

    it('rounds up', () => {
      amount = '1000100'
      const fee = computeFee(amount, policy)

      expect(fee).to.be.eql('2001')
    })
  })

  describe('getBandwidthHints', () => {
    let getBandwidthHints
    let channels
    let pubkey

    beforeEach(() => {
      getBandwidthHints = executeSwap.__get__('getBandwidthHints')

      pubkey = 'mypubkey'

      channels = [
        {
          chanId: 'chan1',
          remotePubkey: 'anotherpubkey',
          localBalance: '1000000',
          remoteBalance: '90',
          active: true
        },
        {
          chanId: 'chan2',
          remotePubkey: 'theirpubkey',
          active: true,
          localBalance: '87777',
          remoteBalance: '56556'
        }
      ]
    })

    it('produces hints for every channel we are party to', () => {
      const hints = getBandwidthHints(channels, pubkey)

      expect(Object.keys(hints)).to.have.lengthOf(2)
    })

    it('skips channels that are inactive', () => {
      channels.push({ chanId: 'chan3', active: false })
      const hints = getBandwidthHints(channels, pubkey)

      expect(Object.keys(hints)).to.have.lengthOf(2)
    })

    it('assigns hints to the channel id', () => {
      const hints = getBandwidthHints(channels, pubkey)

      expect(hints).to.have.property('chan1')
      expect(hints).to.have.property('chan2')
    })

    it('assigns balances to the right pubkeys', () => {
      const hints = getBandwidthHints(channels, pubkey)

      expect(hints.chan1).to.be.eql({
        mypubkey: '1000000',
        anotherpubkey: '90'
      })
      expect(hints.chan2).to.be.eql({
        mypubkey: '87777',
        theirpubkey: '56556'
      })
    })
  })

  describe('findPaths', () => {
    let findPaths
    let edges
    let hints
    let fromPubKey
    let toPubKey
    let symbol
    let amount
    let visited

    beforeEach(() => {
      findPaths = executeSwap.__get__('findPaths')

      edges = [
        {
          channelId: '1234',
          chanPoint: '0190019283',
          lastUpdate: 10284012384,
          node1Pub: 'mypub',
          node2Pub: 'theirpub',
          capacity: '10000008',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 90
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 100
          }
        },
        {
          channelId: '4321',
          chanPoint: '019098324283',
          lastUpdate: 10284012374,
          node1Pub: 'theirpub',
          node2Pub: 'anotherpub',
          capacity: '20000000',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 90
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 100
          }
        }
      ]

      hints = {
        '1234': {
          'mypub': '1000000',
          'theirpub': '999000'
        }
      }

      fromPubKey = 'mypub'
      toPubKey = 'anotherpub'
      symbol = 'LTC'
      amount = '2000'

      visited = []
    })

    it('finds a complete path to the destination', () => {
      const path = findPaths(edges, hints, fromPubKey, toPubKey, symbol, amount, visited)

      expect(path).to.be.an('array')
      expect(path).to.have.lengthOf(2)
      expect(path[0]).to.be.eql({
        fromPubKey: 'mypub',
        toPubKey: 'theirpub',
        channelId: '1234',
        capacity: '10000008',
        policy: {
          feeBaseMsat: '1000',
          feeRateMilliMsat: '7',
          minHtlc: '144',
          timeLockDelta: 90
        }
      })
      expect(path[1]).to.be.eql({
        fromPubKey: 'theirpub',
        toPubKey: 'anotherpub',
        channelId: '4321',
        capacity: '20000000',
        policy: {
          feeBaseMsat: '1000',
          feeRateMilliMsat: '7',
          minHtlc: '144',
          timeLockDelta: 90
        }
      })
    })

    it('returns undefined if there is no path', () => {
      const path = findPaths(edges, hints, fromPubKey, 'mickeymouse', symbol, amount, visited)

      expect(path).to.be.undefined()
    })
  })

  describe('findOutboundChannels', () => {
    let findOutboundChannels
    let getChannelSymbol
    let edges
    let hints
    let fromPubKey
    let symbol
    let amount
    let visited
    let revert

    beforeEach(() => {
      getChannelSymbol = sinon.stub().returns('LTC')
      revert = executeSwap.__set__('getChannelSymbol', getChannelSymbol)
      findOutboundChannels = executeSwap.__get__('findOutboundChannels')

      edges = [
        {
          channelId: '1234',
          chanPoint: '0190019283',
          lastUpdate: 10284012384,
          node1Pub: 'mypub',
          node2Pub: 'theirpub',
          capacity: '10000008',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 90
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 100
          }
        },
        {
          channelId: '4321',
          chanPoint: '019098324283',
          lastUpdate: 10284012374,
          node1Pub: 'theirpub',
          node2Pub: 'anotherpub',
          capacity: '20000000',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 90
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7',
            minHtlc: '144',
            timeLockDelta: 100
          }
        }
      ]

      hints = {
        '1234': {
          'mypub': '1000000',
          'theirpub': '999000'
        }
      }

      fromPubKey = 'mypub'
      symbol = 'LTC'
      amount = '2000'

      visited = []
    })

    afterEach(() => {
      revert()
    })

    it('provides an array of channels', () => {
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.be.an('array')
    })

    it('returns channels that are connected to this one', () => {
      const channels = findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)

      expect(channels).to.have.lengthOf(1)
      expect(channels[0]).to.have.property('channelId', '1234')
    })

    it('checks bandwidth in the hints', () => {
      hints['1234']['mypub'] = '1000'
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('skips channels that have been visited', () => {
      visited.push('1234')
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('only returns channels for the right symbol', () => {
      symbol = 'BTC'
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('relies on channel capacity for filtering', () => {
      hints = {}
      edges[0].capacity = '10'
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('constructs a channel', () => {
      const channels = findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)
      const channel = channels[0]

      expect(channel).to.have.property('fromPubKey', 'mypub')
      expect(channel).to.have.property('capacity', '10000008')
      expect(channel).to.have.property('channelId', '1234')
      expect(channel).to.have.property('toPubKey', 'theirpub')
      expect(channel).to.have.property('policy')
      expect(channel.policy).to.be.eql(edges[1].node1Policy)
    })
  })
})
