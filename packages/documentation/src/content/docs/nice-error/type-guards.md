---
title: Type guards
description: The type guards nice-code provides, and when to use each.
---

nice-code exposes type guards at four levels. Pick the narrowest one you need — it produces the tightest payload type.

## 1. Is it any nice-error?

```ts
NiceError.is(e)
```

Returns `true` if `e` is any nice-error. After the guard, `e` is typed as `NiceError<unknown>`.

## 2. Is it from a specific domain?

```ts
BillingError.is(e)
```

Inside the guard, `e.variant` is narrowed to the union of variant names; `e.payload` is the union of payload shapes.

## 3. Is it a specific variant?

```ts
BillingError.CardDeclined.is(e)
```

Inside the guard, `e.payload` is narrowed to exactly that variant's payload.

## 4. Does it match a shape?

Rare, but handy:

```ts
NiceError.matches(e, { domain: "billing", variant: "CardDeclined" })
NiceError.matches(e, { domain: "billing" })                    // any billing
NiceError.matches(e, { code: "billing/CardDeclined" })
```

## Combining with `switch`

`switch (e.variant)` is a type-level narrowing tool. Use it when `e` is already a domain-scoped nice-error.

```ts
if (BillingError.is(e)) {
  switch (e.variant) {
    case "CardDeclined":    /* e.payload is CardDeclined payload */
    case "InsufficientFunds": /* etc. */
  }
}
```

## Narrowing discriminators

If a variant has a discriminator, you can match on it:

```ts
if (ValidationError.Field.is(e) && e.payload.field === "email") {
  // e.payload.field narrows to "email"
}
```

## Exhaustive check

Use `assertNever` to force yourself to handle every variant:

```ts
import { assertNever } from "@nice-code/error"

if (BillingError.is(e)) {
  switch (e.variant) {
    case "CardDeclined":      return a()
    case "InsufficientFunds":  return b()
    case "Expired":            return c()
    default: assertNever(e)    // compile error if variants are added
  }
}
```
