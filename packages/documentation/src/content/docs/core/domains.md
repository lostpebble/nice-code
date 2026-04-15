---
title: Error Domains
description: Define typed error schemas and create errors from them.
---

An error domain is a named collection of error definitions. Each definition describes a single kind of error — its message, HTTP status code, and optional typed context payload.

## Defining a domain

```ts
import { defineNiceError, err } from "@nice-error/core";

const err_billing = defineNiceError({
  domain: "err_billing",
  schema: {
    payment_failed: err<{ reason: string }>({
      message: ({ reason }) => `Payment failed: ${reason}`,
      httpStatusCode: 402,
      context: { required: true },
    }),
    card_expired: err({
      message: "Card has expired",
      httpStatusCode: 402,
    }),
    insufficient_funds: err({
      message: "Insufficient funds",
      httpStatusCode: 402,
    }),
  },
});
```

The `domain` string is a stable identifier used for serialization and ancestry checks. It should be unique across your application.

## The `err()` builder

`err<C>(meta?)` declares a single error schema entry.

```ts
// No context
err({ message: "Something went wrong", httpStatusCode: 500 })

// Optional context
err<{ userId: string }>({
  message: ({ userId }) => `User ${userId} not found`,
  httpStatusCode: 404,
})

// Required context — TypeScript will enforce that context is passed at creation
err<{ field: string }>({
  message: ({ field }) => `Invalid value for: ${field}`,
  httpStatusCode: 422,
  context: { required: true },
})
```

`message` and `httpStatusCode` can be static values or functions that receive the context:

```ts
err<{ code: number }>({
  message: ({ code }) => `Gateway returned ${code}`,
  httpStatusCode: ({ code }) => (code >= 500 ? 502 : 400),
  context: { required: true },
})
```

## Creating errors

```ts
// Single ID, no context
const error = err_billing.fromId("card_expired");

// Single ID with context
const error = err_billing.fromId("payment_failed", { reason: "card declined" });

error.message;        // "Payment failed: card declined"
error.httpStatusCode; // 402
error.domain;         // "err_billing"
```

When `context.required: true` the second argument is mandatory — TypeScript enforces this statically.

## Attaching an origin error

Preserve the underlying cause alongside the typed error:

```ts
try {
  await stripe.charge(amount);
} catch (e) {
  throw err_billing
    .fromId("payment_failed", { reason: "gateway error" })
    .withOriginError(e);
}
```

The original error is available on `error.originError` and is included in `toJsonObject()`.

## Fingerprint comparison

Check whether two errors represent the same kind of problem (same domain, same ID set — ignoring context values):

```ts
const a = err_billing.fromId("payment_failed", { reason: "card declined" });
const b = err_billing.fromId("payment_failed", { reason: "network timeout" });

a.matches(b); // true — same domain, same id set
```
