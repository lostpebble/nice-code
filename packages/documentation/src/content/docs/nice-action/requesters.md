---
title: Requesters
description: Create typed clients for calling your actions.
---

A **requester** is the client-side object returned by `createRequester`. Each method on it corresponds to one action in the domain.

```ts
import { createRequester } from "@nice-code/action"
import { Billing } from "@/actions/billing"

export const billing = createRequester(Billing, {
  endpoint: "/api/billing",
  transport: fetch,
})
```

## Transport

Any `(req: Request) => Promise<Response>` function works:

```ts
createRequester(Billing, {
  endpoint: "/api/billing",
  transport: async (req) => {
    // add auth headers, tracing, etc.
    req.headers.set("authorization", `Bearer ${getToken()}`)
    return fetch(req)
  },
})
```

For non-fetch transports (WebSocket, postMessage, etc.), provide a `transport` that satisfies the same `Request → Response` shape.

## Per-call options

Every requester method accepts an options bag as its second argument:

```ts
billing.chargeCard(
  { amount: 5000, currency: "USD" },
  {
    signal: ac.signal,
    timeout: 10_000,
    headers: { "x-idempotency-key": key },
    retries: 2,
  },
)
```

## Middleware

Middleware runs in order and can wrap the request/response:

```ts
export const billing = createRequester(Billing, {
  endpoint: "/api/billing",
  transport: fetch,
  middleware: [
    logging(),
    retry({ times: 2, backoff: "expo" }),
    tracing(),
  ],
})
```

Write your own:

```ts
const timing = (): RequesterMiddleware => async (req, next) => {
  const start = performance.now()
  try {
    return await next(req)
  } finally {
    console.log(`${req.action} took ${performance.now() - start}ms`)
  }
}
```

## Type helpers

Sometimes you want the input / output types extracted from a domain:

```ts
import type { ActionInput, ActionOutput } from "@nice-code/action"

type ChargeInput  = ActionInput<typeof Billing, "chargeCard">
type ChargeOutput = ActionOutput<typeof Billing, "chargeCard">
```

## Testing

Swap the transport for a function that calls your resolvers directly:

```ts
const fakeTransport = makeInProcessTransport(resolvers)
const billing = createRequester(Billing, {
  endpoint: "n/a",
  transport: fakeTransport,
})
```

No network, full type safety.
