---
title: Multi-ID Errors
description: Attach multiple error IDs to a single error instance.
---

A single `NiceError` can carry more than one ID. This is useful when an error is caused by several simultaneous conditions that all belong to the same error domain.

## Creating multi-ID errors

### `fromContext(map)`

Pass a map of `{ id: context }` pairs. All IDs are active at once:

```ts
const error = err_billing.fromContext({
  payment_failed: { reason: "retry limit" },
  card_expired: undefined,
});

error.getIds();    // ["payment_failed", "card_expired"]
error.hasMultiple; // true
```

For IDs with no context (or optional context) pass `undefined`.

### Chaining `addId` and `addContext`

Start with a single-ID error and build it up:

```ts
const error = err_billing
  .fromId("payment_failed", { reason: "network timeout" })
  .addId("card_expired");         // no context needed

// Add multiple IDs at once
const error2 = err_billing
  .fromId("payment_failed", { reason: "declined" })
  .addContext({
    card_expired: undefined,
    insufficient_funds: undefined,
  });
```

`addId` and `addContext` return a new error instance — the original is unchanged.

## Narrowing multi-ID errors

### `hasId(id)`

Still works — returns `true` if that ID is among the active set:

```ts
if (error.hasId("payment_failed")) {
  error.getContext("payment_failed").reason; // typed
}
```

### `hasOneOfIds(ids)`

Returns `true` if at least one of the listed IDs is active:

```ts
if (error.hasOneOfIds(["card_expired", "insufficient_funds"])) {
  // at least one of these is present
}
```

## Introspection

```ts
error.getIds();           // all active IDs in order
error.hasMultiple;        // boolean
error.getErrorDataForId("payment_failed"); // raw internal entry (id + context + state)
```

## Typical use case

Multi-ID errors are useful when a validation step produces several simultaneous failures, or when a compound operation fails for more than one reason and you want to surface them all to the caller without creating separate error instances.
