---
title: Executing
description: How actions run end-to-end, from requester to resolver.
---

The lifecycle of an action call:

```
client: Billing.chargeCard({ amount, currency })
          │
          ▼ requester serializes input
   ┌─────────────────────┐
   │ POST /api/billing   │
   │  action: chargeCard │
   │  input: { ... }     │
   └─────────────────────┘
          │
          ▼
 server: resolver runs
   ├─ returns output   ────►  serialized, sent back
   └─ throws NiceError ────►  serialized, sent back with 4xx/5xx
          │
          ▼ requester deserializes
 client: output is typed, or error is typed and thrown
```

## Minimum pieces

- **Server**: one `resolve()` call per action.
- **Client**: one `createRequester()` call per domain.
- **Transport**: anything that moves bytes. fetch works out of the box.

## Server resolver

```ts title="server/billing.ts"
import { Billing } from "@/actions/billing"
import { BillingError } from "@/errors"

export const resolvers = Billing.resolvers({
  chargeCard: async ({ amount, currency }, ctx) => {
    const user = await ctx.requireUser()
    const card = await ctx.db.getCard(user.id)
    if (!card) throw new BillingError.NoCardOnFile()
    return await stripe.charge({ amount, currency, source: card.token })
  },

  getInvoice: async ({ id }, ctx) => {
    const inv = await ctx.db.invoice(id)
    if (!inv) throw new BillingError.InvoiceNotFound({ id })
    return inv
  },

  listInvoices: async ({ limit, cursor }, ctx) => {
    return ctx.db.listInvoices(ctx.user.id, { limit, cursor })
  },
})
```

`resolvers()` is type-checked against the domain definition: missing actions fail at compile time, input/output shapes must match.

## Client requester

```ts title="client/billing.ts"
import { createRequester } from "@nice-code/action"
import { Billing } from "@/actions/billing"

export const billing = createRequester(Billing, {
  transport: fetch,
  endpoint: "/api/billing",
})

// later…
const invoice = await billing.getInvoice({ id: "inv_123" })
// invoice is fully typed
```

Errors declared in the domain propagate as typed throws on the client:

```ts
try {
  await billing.chargeCard({ amount: 5000, currency: "USD" })
} catch (e) {
  if (BillingError.NoCardOnFile.is(e)) openAddCardSheet()
  else throw e
}
```

## Cancellation

All requester calls accept an `AbortSignal`:

```ts
const ac = new AbortController()
const p = billing.listInvoices({ limit: 50 }, { signal: ac.signal })
// …later
ac.abort()
```

## Middleware

Both resolvers and requesters accept middleware — see [Resolvers](/nice-action/resolvers/) and [Requesters](/nice-action/requesters/).
