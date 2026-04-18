---
title: Handling & matching
description: Idiomatic patterns for catching, narrowing, and handling nice-code errors.
---

## The single-variant match

```ts
try {
  await chargeCard(amount)
} catch (e) {
  if (BillingError.InsufficientFunds.is(e)) {
    // e.payload is typed { required: number; available: number }
    openTopUpFlow(e.payload.required - e.payload.available)
    return
  }
  throw e
}
```

## Match any variant of a domain

```ts
if (BillingError.is(e)) {
  // e is a BillingError, but payload isn't narrowed yet.
  switch (e.variant) {
    case "CardDeclined":    return toast(e.payload.reason)
    case "InsufficientFunds": return openTopUpFlow(/* … */)
    case "Expired":         return promptCardUpdate()
  }
}
```

`switch (e.variant)` narrows the payload — inside `"CardDeclined"`, `e.payload` is typed as the card-declined shape, and so on.

## `match()` helper

For exhaustive handling, use `NiceError.match`:

```ts
const message = NiceError.match(e, {
  "billing/CardDeclined":     (p) => `Card declined: ${p.reason}`,
  "billing/InsufficientFunds": (p) => `Short by ${p.required - p.available}`,
  "billing/Expired":           ()  => `Your card has expired`,
  _: () => `Payment failed`,   // fallback required
})
```

TypeScript checks that every declared variant has a handler (or an `_` fallback).

## Ignoring unrelated throws

Always re-throw things you don't handle:

```ts
try {
  await op()
} catch (e) {
  if (NetError.Timeout.is(e)) return retry()
  throw e   // everything else bubbles up
}
```

## Result-style handling

If you prefer not to throw, wrap the call:

```ts
import { tryCatch } from "@nice-code/error"

const [err, user] = await tryCatch(() => getUser(id))
if (err) {
  if (UserError.NotFound.is(err)) { /* … */ }
  return
}
// user is narrowed to the success type
```

## Anti-patterns

- **Don't match on `e.message`.** Messages are human-readable and may change.
- **Don't match on `instanceof Error`.** Use `NiceError.is(e)`, `Domain.is(e)`, or `Variant.is(e)`.
- **Don't construct errors with a string payload.** Give them a real shape — future-you will thank you.
