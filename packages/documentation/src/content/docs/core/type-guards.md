---
title: Type Guards & Narrowing
description: Narrow error types with hasId, hasOneOfIds, and domain checks.
---

NiceError ships a set of type guards that narrow the TypeScript type of an error as you drill into it.

## Narrowing by ID

### `hasId(id)`

Narrows the active ID to a single value. After the guard, `getContext(id)` is fully typed.

```ts
const error = err_billing.fromId("payment_failed", { reason: "card declined" });

if (error.hasId("payment_failed")) {
  // TypeScript knows "payment_failed" is active
  error.getContext("payment_failed").reason; // string
}
```

### `hasOneOfIds(ids)`

Narrows the active IDs to a subset. `getContext` is available for any ID in the list.

```ts
if (error.hasOneOfIds(["card_expired", "insufficient_funds"])) {
  // error is narrowed to those two IDs
  error.getIds(); // ["card_expired"] | ["insufficient_funds"]
}
```

## Accessing context

`getContext(id)` returns the typed context for a specific active ID. TypeScript will error if you call it with an ID that is not active.

```ts
const error = err_billing.fromId("payment_failed", { reason: "declined" });

const { reason } = error.getContext("payment_failed");
//      ^? string
```

For errors with no context defined, calling `getContext` still works but returns `undefined`.

## Domain checks

### `isExact(error)`

Returns `true` and narrows the type when the error belongs to exactly this domain.

```ts
const error = castNiceError(caught);

if (err_billing.isExact(error)) {
  // error: NiceError<typeof err_billing._schema, ...>
  // all billing IDs are available in hasId / getContext
}
```

### `isThisOrChild(error)`

Returns `true` for exact matches and for errors from child domains.

```ts
if (err_app.isThisOrChild(error)) {
  // error came from err_app or any of its descendants
}
```

### `isParentOf(target)`

Check the ancestry of a domain or an error:

```ts
err_app.isParentOf(err_auth);  // true — err_auth is a child domain
err_app.isParentOf(error);     // true — error came from err_auth or below
```

## Domain hierarchy narrowing

Combine domain checks with ID guards:

```ts
const error = castNiceError(caught);

if (err_billing.isExact(error)) {
  if (error.hasId("payment_failed")) {
    const { reason } = error.getContext("payment_failed");
    // handle payment_failed with typed context
  }
}
```

## `getIds()`

Inspect all active IDs on an error:

```ts
error.getIds();    // string[] of active IDs
error.hasMultiple; // true when more than one ID is active
```
