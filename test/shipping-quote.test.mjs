import test from 'node:test'
import assert from 'node:assert/strict'
import { createShippingQuoteRunner } from '../src/utils/shipping-quote.mjs'

function setup() {
  const requests = []
  const events = []
  const runner = createShippingQuoteRunner({
    request: (payload, signal) => new Promise((resolve, reject) => requests.push({ payload, signal, resolve, reject })),
    onStart: () => events.push('loading'),
    onSuccess: (response, payload) => events.push({ response, payload }),
    onError: error => events.push(error.message),
    onSettled: () => events.push('settled'),
  })
  return { runner, requests, events }
}

test('rapid location selection only displays the latest fee, even when old responses arrive last', async () => {
  const { runner, requests, events } = setup()
  const first = runner.run({ addressId: 1, location: 'first' })
  const second = runner.run({ addressId: 1, location: 'second' })
  assert.equal(requests[0].signal.aborted, true)
  requests[1].resolve({ fee: 8 })
  await second
  requests[0].resolve({ fee: 2 })
  await first
  assert.deepEqual(events, ['loading', 'loading', { response: { fee: 8 }, payload: { addressId: 1, location: 'second' } }, 'settled'])
})

test('an obsolete error cannot replace a newer fee or clear its loading state', async () => {
  const { runner, requests, events } = setup()
  const first = runner.run({ addressId: 1 })
  const second = runner.run({ addressId: 2 })
  requests[0].reject(new Error('old route failed'))
  await first
  assert.deepEqual(events, ['loading', 'loading'])
  requests[1].resolve({ fee: 5 })
  await second
  assert.equal(events.at(-1), 'settled')
  assert.equal(events.some(event => event === 'old route failed'), false)
})

test('editing an address invalidates its outstanding quote and a current failure stays visible', async () => {
  const { runner, requests, events } = setup()
  const old = runner.run({ addressId: 1 })
  runner.invalidate()
  assert.equal(requests[0].signal.aborted, true)
  requests[0].resolve({ fee: 3 })
  await old
  assert.deepEqual(events, ['loading'])
  const latest = runner.run({ addressId: 2 })
  requests[1].reject(new Error('new route unavailable'))
  await latest
  assert.deepEqual(events, ['loading', 'loading', 'new route unavailable', 'settled'])
})
