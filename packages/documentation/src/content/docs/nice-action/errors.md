---
title: Errors in actions
description: How NiceError and NiceAction work together across the wire.
---

Action domains declare which error domains they can throw. That declaration does three things:

1. Tells the **resolver** which errors are safe to throw (others become generic 500s).
2. Tells the **serializer** which errors to allow through the wire.
3. Tells the **requester** which errors to reconstruct on the client.

```ts
const Billing = NiceAction.domain("billing", {
  errors: [AuthError, BillingError, ValidationError],
  actions: { /* … */ },
})
```

## The full round trip

```ts title="server/resolvers.ts"
Billing.resolvers({
  chargeCard: async ({ amount }, ctx) => {
    const user = ctx.requireUser()       // may throw AuthError.NotSignedIn
    const card = await ctx.db.getCard(user.id)
    if (!card) throw new BillingError.NoCardOnFile()
    if (amount <= 0) {
      throw new ValidationError.Field({ field: "amount", rule: "positive" })
    }
    return stripe.charge(card, amount)
  },
})
```

```ts title="client/pay.tsx"
try {
  await billing.chargeCard({ amount: 5000, currency: "USD" })
} catch (e) {
  if (AuthError.NotSignedIn.is(e))        return router.push("/signin")
  if (BillingError.NoCardOnFile.is(e))    return openAddCardSheet()
  if (ValidationError.Field.is(e))        return setFieldError(e.payload.field)
  throw e
}
```

## Errors outside the domain

If a resolver throws an error whose domain isn't in the `errors: [...]` list:

- Server: logs a warning.
- Wire: 500 Internal Server Error, body has a generic nice-error envelope with `domain: "action"`, `variant: "InternalError"`.
- Client: throws `ActionError.InternalError` (no domain-specific info).

This prevents accidentally leaking internal exception details.

## Adding a new error mid-flight

Forgot to add a new error domain? TypeScript will tell you:

```ts
Billing.resolvers({
  chargeCard: async (...) => {
    throw new FraudError.Blocked()  // ❌ Type error
    //        └── FraudError is not in Billing.errors
  },
})
```

Add it to the domain definition, and both server and client get the new type.

## Client-side error propagation

Requesters re-throw typed errors on the client with the original payload intact. Stack traces are preserved in development and stripped in production by default.

```ts
try {
  await billing.chargeCard(...)
} catch (e) {
  // e is typed as the union:
  //   AuthError[variant] | BillingError[variant] | ValidationError[variant]
  //   | ActionError.InternalError | ActionError.Timeout | ActionError.Transport
}
```

The extra `ActionError.*` union members cover transport-level failures: timeout, network, protocol. Handle them once at the top of your app.
