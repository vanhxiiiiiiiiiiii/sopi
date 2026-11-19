// Cancel superseded requests and guard responses even if the transport ignores cancellation.
export function createShippingQuoteRunner({ request, onStart, onSuccess, onError, onSettled }) {
  let revision = 0
  let controller
  function invalidate() {
    revision++
    controller?.abort()
  }
  async function run(payload) {
    invalidate()
    const current = revision
    controller = new AbortController()
    onStart()
    try {
      const response = await request(payload, controller.signal)
      if (current === revision) onSuccess(response, payload)
    }
    catch (failure) {
      if (current === revision) onError(failure)
    }
    finally {
      if (current === revision) onSettled()
    }
  }
  return { run, invalidate }
}
