---
title: Handling & Routing
description: Route errors to handlers with handleWith, handleWithAsync, and matchFirst.
---

Once you've caught an error, you need to route it to the right response. `nice-code/error` provides three ways to do this.

## `handleWith` — first-match routing

Pass an ordered list of cases. The first case that matches the error will run; the rest are skipped.

```ts
import { forDomain, forIds } from "@nice-code/error";

const handled = error.handleWith([
  forIds(err_billing, ["payment_failed"], (h) => {
    const { reason } = h.getContext("payment_failed");
    res.status(402).json({ reason });
  }),
  forDomain(err_billing, (h) => {
    res.status(h.httpStatusCode).json({ error: h.message });
  }),
  forDomain(err_auth, (h) => {
    res.status(401).json({ error: "Unauthorized" });
  }),
]);

if (!handled) {
  // No case matched — pass the error along
  next(error);
}
```

`handleWith` returns `true` when a case matched, `false` when none did.

### `forDomain(domain, handler)`

Fires for any error from that domain, regardless of which IDs are active. The handler receives a fully-typed `NiceErrorHydrated` with the domain's schema.

```ts
forDomain(err_billing, (h) => {
  res.status(h.httpStatusCode).json({ error: h.message });
})
```

### `forIds(domain, ids, handler)`

Fires only if the error is from that domain **and** at least one of the specified IDs is active. The handler receives an error narrowed to those IDs.

```ts
forIds(err_billing, ["payment_failed"], (h) => {
  // h.getContext("payment_failed") is typed and guaranteed available
  const { reason } = h.getContext("payment_failed");
})
```

## `handleWithAsync` — async handlers

The same as `handleWith` but supports `async` handler functions:

```ts
const handled = await error.handleWithAsync([
  forDomain(err_billing, async (h) => {
    await db.logFailedPayment(h);
    await notifyOps(h.message);
  }),
]);
```

## `matchFirst` — pattern-match by ID

Map error IDs directly to handler functions. Returns the result of the first matching handler.

```ts
import { matchFirst } from "@nice-code/error";

const message = matchFirst(error, {
  payment_failed: ({ reason }) => `Payment failed: ${reason}`,
  card_expired:   ()           => "Your card has expired",
  _:              ()           => "A billing error occurred",
});
```

The `_` key is an optional fallback that runs when no ID matches.

`matchFirst` iterates the error's active IDs in order and calls the first handler it finds a key for. The handler receives the context for that ID (typed).

## Domain hierarchy in routing

`forDomain` matches on exact domain equality — it will not fire for child domains. To match a domain and all its children, use `isThisOrChild` as a guard before calling `handleWith`:

```ts
// Matches err_app or any child domain
if (err_app.isThisOrChild(error)) {
  // handle any app-level error
}
```

## Return values

Both `forDomain` and `forIds` handlers can return values, which are passed back as the return value of `handleWith`:

```ts
const statusCode = error.handleWith([
  forDomain(err_billing, (h) => h.httpStatusCode),
  forDomain(err_auth, () => 401),
]) ?? 500;
```
