# nice-error

Typed, serializable errors for TypeScript. Define error domains with schemas, get autocomplete on IDs, strongly-typed context, and safe serialization across API boundaries.

## Install

```bash
bun add @nice-error/core    # or npm / yarn / pnpm
```

## Quick start

### 1. Define an error domain

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

### 2. Create errors

```ts
const error = err_billing.fromId("payment_failed", { reason: "card declined" });

error.message;        // "Payment failed: card declined"
error.httpStatusCode; // 402
```

### 3. Access context (type-safe)

```ts
const { reason } = error.getContext("payment_failed");
//      ^? string
```

### 4. Narrow with type guards

```ts
if (error.hasId("payment_failed")) {
  error.getContext("payment_failed").reason; // string — TS knows this ID is active
}

if (error.hasOneOfIds(["card_expired", "insufficient_funds"])) {
  // narrowed to those two IDs
}
```

## Multi-ID errors

Attach multiple error IDs to a single error with `fromContext` or by chaining `addId` / `addContext`:

```ts
// From multiple IDs at once
const error = err_billing.fromContext({
  payment_failed: { reason: "retry limit" },
  card_expired: undefined,
});

error.getIds();    // ["payment_failed", "card_expired"]
error.hasMultiple; // true

// Or chain onto an existing error
const error2 = err_billing
  .fromId("payment_failed", { reason: "network timeout" })
  .addId("card_expired");
```

## Domain hierarchy

Child domains inherit their parent's ancestry for `isParentOf` checks:

```ts
const err_app = defineNiceError({ domain: "err_app", schema: {} });

const err_auth = err_app.createChildDomain({
  domain: "err_auth",
  schema: {
    unauthorized: err({ message: "Unauthorized", httpStatusCode: 401 }),
  },
});

err_app.isParentOf(err_auth); // true

const error = err_auth.fromId("unauthorized");
err_auth.is(error);           // true  — exact domain match
err_app.is(error);            // false — is() is exact, not ancestral
err_app.isParentOf(error);    // true  — ancestry check
```

## Serialization & hydration across API boundaries

Errors serialize to plain JSON and can be safely reconstructed on the other side.

### Server — throw and serialize

```ts
function handleOrder(sku: string) {
  const error = err_order.fromId("out_of_stock", { sku });

  return Response.json(error.toJsonObject(), {
    status: error.httpStatusCode, // 409
  });
}
```

### Client — cast and narrow

```ts
import { castNiceError, isNiceErrorObject } from "@nice-error/core";

const res = await fetch("/api/order?sku=ABC-123");

if (!res.ok) {
  const body = await res.json();
  const error = castNiceError(body);

  if (err_order.is(error)) {
    if (error.hasId("out_of_stock")) {
      error.getContext("out_of_stock").sku; // string — fully typed
    }
  }
}
```

`castNiceError` handles anything — `Error`, `string`, `null`, serialized JSON — and always returns a `NiceError`. For a one-step cast + domain check, use `castAndHydrate`:

```ts
import { castAndHydrate } from "@nice-error/core";

const error = castAndHydrate(caughtValue, err_order);

if (err_order.is(error)) {
  // fully hydrated — getContext, addId etc. all available
}
```

## Error handling with `handleWith`

Route errors to the right handler without manual `instanceof` checks:

```ts
import { forDomain, forIds } from "@nice-error/core";

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

if (!handled) next(error); // no case matched — pass along
```

Use `handleWithAsync` when handlers perform async work:

```ts
const handled = await error.handleWithAsync([
  forDomain(err_billing, async (h) => {
    await db.logFailedPayment(h);
    await notifyOps(h.message);
  }),
]);
```

## Pattern matching with `matchFirst`

Match an error against a map of id → handler functions:

```ts
import { matchFirst } from "@nice-error/core";

const message = matchFirst(error, {
  payment_failed: ({ reason }) => `Payment failed: ${reason}`,
  card_expired:   ()           => "Your card has expired",
  _:              ()           => "A billing error occurred",
});
```

## Fingerprint comparison with `matches`

Check whether two errors represent the same kind of problem (same domain + same IDs, ignoring context values):

```ts
const a = err_billing.fromId("payment_failed", { reason: "card declined" });
const b = err_billing.fromId("payment_failed", { reason: "network timeout" });

a.matches(b); // true  — same domain, same id set
```

## Attaching an origin error

Preserve the underlying cause alongside the typed error:

```ts
try {
  await stripe.charge(amount);
} catch (e) {
  throw err_billing.fromId("payment_failed", { reason: "gateway error" }).withOriginError(e);
}
```

The original error is available on `error.originError` and is included in `toJsonObject()`.

## Packed errors

Some runtime boundaries only propagate an error's `message` string and discard everything else — Cloudflare Durable Objects are a common example. When a Durable Object method throws, only `error.message` crosses the boundary; the full error object is lost.

Packing embeds the serialized error into the `message` (or `cause`) field so it survives the crossing, then you unpack it on the other side.

### `msg_pack` — serialize into `message` (default)

Use when only `error.message` passes the boundary:

```ts
// Inside a Durable Object
const error = err_billing.fromId("payment_failed", { reason: "card declined" });
throw error.pack(); // or error.pack("msg_pack")
```

```ts
// Caller receiving the thrown error
import { castNiceError } from "@nice-error/core";

const error = castNiceError(caught); // automatically unpacks from message
if (err_billing.is(error)) {
  error.getContext("payment_failed").reason; // "card declined" — fully restored
}
```

### `cause_pack` — serialize into `cause`

Use when `error.cause` is preserved but `message` should stay human-readable:

```ts
throw error.pack("cause_pack");
```

### Define pack behavior at the domain level

Set a default pack strategy on the domain so every error it creates is automatically packed:

```ts
import { EErrorPackType } from "@nice-error/core";

const err_durable = defineNiceError({
  domain: "err_durable",
  schema: { ... },
  packAs: () => EErrorPackType.msg_pack,
});

// Child domains inherit the parent's pack strategy
const err_durable_storage = err_durable.createChildDomain({ ... });
```

Or set it imperatively after creation:

```ts
err_durable.packAs(EErrorPackType.msg_pack);
```

### Unpack manually

```ts
const error = castNiceError(caught).unpack();
```

`castNiceError` already handles unpacking, so manual `.unpack()` is rarely needed.

## API reference

| Export | Description |
|---|---|
| `defineNiceError(opts)` | Create a root error domain with a typed schema |
| `err<C>(meta?)` | Define a schema entry; pass context type as generic |
| `NiceErrorDefined.createChildDomain(opts)` | Create a child domain that inherits ancestry |
| `NiceErrorDefined.fromId(id, ctx?)` | Create an error for a single schema ID |
| `NiceErrorDefined.fromContext(map)` | Create a multi-ID error |
| `NiceErrorDefined.hydrate(error)` | Promote a cast `NiceError` back to `NiceErrorHydrated` |
| `NiceErrorDefined.is(err)` | Type guard — exact domain match |
| `NiceErrorDefined.isParentOf(target)` | Ancestry check (accepts domain or error) |
| `NiceErrorDefined.packAs(type)` | Set the default pack strategy for this domain |
| `NiceError.hasId(id)` | Type guard — narrows to a single ID |
| `NiceError.hasOneOfIds(ids)` | Type guard — narrows to a subset of IDs |
| `NiceError.getContext(id)` | Get the typed context for an active ID |
| `NiceError.getIds()` | List all active IDs |
| `NiceError.addId(id, ctx?)` | Return a new error with an additional ID |
| `NiceError.addContext(map)` | Return a new error with additional IDs |
| `NiceError.matches(other)` | Compare domain + ID fingerprint (ignores context) |
| `NiceError.withOriginError(err)` | Attach the underlying cause error |
| `NiceError.toJsonObject()` | Serialize to a plain JSON object |
| `NiceError.pack(type?)` | Pack the error into `message` or `cause` for boundary crossing |
| `NiceError.unpack()` | Restore the error from its packed state |
| `NiceError.handleWith(cases)` | Dispatch to the first matching case (sync) |
| `NiceError.handleWithAsync(cases)` | Dispatch to the first matching case (async) |
| `forDomain(domain, handler)` | Case that fires for any ID in a domain |
| `forIds(domain, ids, handler)` | Case that fires only for specific IDs |
| `matchFirst(error, handlers)` | Pattern-match an error by ID, returns handler result |
| `castNiceError(value)` | Cast any unknown value to a `NiceError` |
| `castAndHydrate(value, domain)` | Cast + domain check + hydrate in one call |
| `isNiceErrorObject(value)` | Type guard for serialized `NiceError` JSON |
| `isRegularErrorJsonObject(value)` | Type guard for serialized `Error` JSON |
| `InferNiceError<T>` | Utility type — infers the `NiceError` type from a `NiceErrorDefined` |
| `InferNiceErrorHydrated<T>` | Utility type — infers the `NiceErrorHydrated` type from a `NiceErrorDefined` |

## License

MIT
