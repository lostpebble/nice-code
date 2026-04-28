---
title: Errors in actions
description: How @nice-code/error and @nice-code/action work together to give you typed, routable errors across the wire.
---

Action schemas declare which error domains they can throw via `.throws()`. This declaration does two things:

1. Documents what errors callers must handle.
2. Types the `error` field in `executeSafe()` results — giving you a fully-typed discriminated union.

```ts
const shipAction = action()
  .input({ schema: v.object({ orderId: v.string() }) })
  .output({ schema: v.object({ trackingId: v.string() }) })
  .throws(err_order, ["not_found", "already_shipped"] as const)
  .throws(err_payment, ["card_declined", "insufficient_funds"] as const)
  .throws(err_auth)  // all IDs from err_auth
```

## Typed error union from `executeSafe`

```ts
const result = await orderDomain.action("shipOrder").executeSafe({ orderId: "ord-1" })

if (!result.ok) {
  // result.error is typed as the union of all declared errors
  result.error.handleWithSync([
    forId(err_order, "not_found", (h) => {
      res.status(404).json({ error: "Order not found" })
    }),
    forId(err_order, "already_shipped", (h) => {
      res.status(409).json({ error: "Already shipped" })
    }),
    forId(err_payment, "card_declined", (h) => {
      res.status(402).json({ error: "Card declined" })
    }),
    forDomain(err_auth, (h) => {
      res.status(401).json({ error: "Unauthorized" })
    }),
  ])
  return
}

// result.output: { trackingId: string }
```

## Throwing in handlers

Throw typed errors from inside `execution` — they propagate through `executeSafe` as `{ ok: false, error }`:

```ts
new ActionHandler().forAction(orderDomain, "shipOrder", {
  execution: async (primed) => {
    const order = await db.orders.findById(primed.input.orderId)

    if (!order)
      throw err_order.fromId("not_found", { orderId: primed.input.orderId })

    if (order.status === "shipped")
      throw err_order.fromId("already_shipped")

    const payment = await payments.charge(order.total)
    if (!payment.ok)
      throw err_payment.fromId("card_declined", { last4: payment.card.last4 })

    const tracking = await shipping.ship(order)
    return primed.setResponse({ trackingId: tracking.id })
  },
})
```

## Errors cross the wire automatically

When an action fails on the server, the error is serialized as part of the response wire format (`ok: false, error: { ... }`). On the client, `executeSafe` deserializes it back into a typed `NiceError` — no extra handling needed:

```ts
// Client side
const result = await orderDomain.action("shipOrder").executeSafe({ orderId: "ord-1" })

if (!result.ok) {
  // result.error is the same NiceError that was thrown on the server
  result.error.handleWithSync([
    forId(err_payment, "card_declined", (h) => {
      const { last4 } = h.getContext("card_declined")  // typed context, survived the wire
      toast(`Card ending in ${last4} was declined`)
    }),
  ])
}
```

## Undeclared errors

If a handler throws an error that was not declared via `.throws()`, it still propagates. `castNiceError` wraps it when it reaches `executeSafe`, so `result.error` is always a `NiceError`. The TypeScript type will be less specific (`NiceError<err_cast_not_nice>`), but it won't crash.

## Framework errors (`err_nice_action`)

The action system throws its own typed errors for programming mistakes:

| ID | When |
|---|---|
| `action_id_not_in_domain` | `domain.action("id")` called with an unknown ID |
| `domain_no_handler` | `execute()` called but no handler or environment registered |
| `environment_already_registered` | `setRuntimeEnvironment()` called twice on the same root |
| `hydration_domain_mismatch` | Wire domain doesn't match the domain being hydrated into |
| `hydration_action_state_mismatch` | Wire `type` field doesn't match expected state |
| `hydration_action_id_not_found` | Wire action ID isn't in the domain's schema |
| `action_input_validation_failed` | Input failed schema validation (HTTP 400) |
| `action_output_validation_failed` | Output failed schema validation (HTTP 500) |
| `wire_action_not_primed_or_response` | `handleWire` received a wire object with wrong `type` |
| `no_action_execution_handler` | Handler matched but has no `execution` function |

These propagate as normal errors and can be caught with `castNiceError`.

```ts
import { err_nice_action } from "@nice-code/action"

const result = await domain.action("getUser").executeSafe({ userId: "u1" })
if (!result.ok) {
  result.error.handleWithSync([
    forDomain(err_nice_action, (h) => {
      // Framework-level error — likely a bug, not user-facing
      console.error("Action system error:", h.message)
      res.status(500).end()
    }),
    forId(err_user, "not_found", (h) => res.status(404).end()),
  ])
}
```
