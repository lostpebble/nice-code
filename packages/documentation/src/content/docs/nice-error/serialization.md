---
title: Serialization
description: Serialize NiceErrors to JSON and reconstruct them on the other side.
---

NiceErrors are designed to cross serialization boundaries without losing type information.

## Serializing

```ts
const error = err_billing.fromId("payment_failed", { reason: "card declined" });

const json = error.toJsonObject();
// {
//   domain: "err_billing",
//   allDomains: ["err_billing"],
//   ids: [{ id: "payment_failed", context: { reason: "card declined" } }],
//   message: "Payment failed: card declined",
//   httpStatusCode: 402,
// }
```

`toJsonObject()` returns a plain JSON-safe object suitable for `Response.json()`, `JSON.stringify`, or any wire format.

## Server example

```ts
function handleOrder(sku: string) {
  const error = err_order.fromId("out_of_stock", { sku });

  return Response.json(error.toJsonObject(), {
    status: error.httpStatusCode,
  });
}
```

## Client example — `castNiceError`

`castNiceError` accepts anything — a serialized JSON object, a native `Error`, a string, `null` — and always returns a `NiceError`.

```ts
import { castNiceError } from "@nice-code/error";

const body = await res.json();
const error = castNiceError(body);

if (err_order.isExact(error)) {
  if (error.hasId("out_of_stock")) {
    error.getContext("out_of_stock").sku; // string — fully typed
  }
}
```

Non-NiceError values (native `Error`, `null`, primitives) are wrapped in an internal `err_cast_not_nice` domain error so that the returned value always behaves as a `NiceError`.

## One-step cast + hydrate — `castAndHydrate`

Combines `castNiceError` with a domain check:

```ts
import { castAndHydrate } from "@nice-code/error";

const error = castAndHydrate(caughtValue, err_order);

if (err_order.isExact(error)) {
  // fully hydrated — getContext, addId, etc. available
}
```

## Manual hydration

If you have a `NiceErrorDefined` and a cast error object, you can hydrate it explicitly:

```ts
const hydrated = err_order.hydrate(error);
```

This promotes a cast `NiceError` back to a `NiceErrorHydrated` with builder methods (`addId`, `addContext`).

## `isNiceErrorObject(value)`

Type guard for checking if an unknown value is a serialized NiceError JSON object before passing to `castNiceError`:

```ts
import { isNiceErrorObject } from "@nice-code/error";

if (isNiceErrorObject(body)) {
  const error = castNiceError(body);
}
```

## Custom context serialization

Context values must be JSON-safe by default. If your context contains non-serializable types (e.g. class instances), you can attach serialize/deserialize hooks to the schema entry:

```ts
err<{ at: Date }>({
  message: ({ at }) => `Scheduled at ${at.toISOString()}`,
  context: {
    serialize:   ({ at }) => ({ iso: at.toISOString() }),
    deserialize: (s: { iso: string }) => ({ at: new Date(s.iso) }),
  },
})
```

The `deserialize` function is called automatically during hydration.
