---
title: Action domains
description: Declare a set of typed server actions with shared error shapes.
---

An **action domain** is a group of actions that share input, output, and error types.

```ts
import { NiceAction } from "@nice-code/action"
import { AuthError, BillingError } from "./errors"

export const Billing = NiceAction.domain("billing", {
  errors: [AuthError, BillingError],
  actions: {
    getInvoice: {
      input:  { id: "" },
      output: { id: "", total: 0, paidAt: new Date() },
    },
    chargeCard: {
      input:  { amount: 0, currency: "USD" },
      output: { chargeId: "" },
    },
    listInvoices: {
      input:  { limit: 20, cursor: undefined as string | undefined },
      output: { items: [] as Invoice[], nextCursor: undefined as string | undefined },
    },
  },
})
```

The domain is declarative — no implementation yet. You'll attach **resolvers** on the server and create **requesters** on the client.

## Output

`NiceAction.domain()` returns a `NiceActionDomain` object with:

- `.actions` — a map of action descriptors
- `.errors` — the error domains this action set can throw
- `.name` — the domain name (used in wire format)

## Naming

- **Domain name**: lowercase, one word per bounded context. Matches your error domain where possible.
- **Action name**: verb-first camelCase. `getInvoice`, `listInvoices`, `chargeCard`.

## When to split domains

Split when:

- Different auth scopes apply (public vs admin actions)
- Different transports (HTTP vs WebSocket)
- Different error sets (auth errors don't apply to public actions)

Don't split prematurely. A 50-action domain is fine.
