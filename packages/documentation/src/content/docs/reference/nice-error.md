---
title: "@nice-code/error — API reference"
description: The full public surface of @nice-code/error.
tableOfContents:
  maxHeadingLevel: 4
---

## `NiceError`

Static namespace. Never constructed directly.

### `NiceError.domain(name, variants, options?)`

Create an error domain.

| Param | Type | Description |
|---|---|---|
| `name` | `string` | Lowercase domain name. |
| `variants` | `Record<string, PayloadShape>` | Variant → payload shape. |
| `options.extends` | `ErrorClass` | Hierarchy parent. |
| `options.discriminator` | `(e) => string` | Per-variant fine-grained identity. |
| `options.httpStatus` | `Record<Variant, number>` | Wire-format status overrides. |

Returns a `NiceErrorDomain`.

### `NiceError.is(value)`

Type guard: is this value any nice-error?

### `NiceError.serialize(error, options?)`

Returns a JSON string.

`options.stack`: `true | false | "redacted"` — default based on `NODE_ENV`.

### `NiceError.deserialize(json, allowedDomains)`

Reconstruct a nice-error from its serialized form. `allowedDomains` is a list of `NiceErrorDomain` objects.

### `NiceError.fromJSON(obj, allowedDomains)`

Same as `deserialize` but accepts an already-parsed object (for `structuredClone` / worker contexts).

### `NiceError.equals(a, b)`

Identity equality (domain + variant + discriminator).

### `NiceError.identity(e)`

Returns `[domain, variant, discriminator?]`.

### `NiceError.fingerprint(e)`

Returns a stable string. Good for cache keys, log aggregation, analytics.

### `NiceError.matches(e, pattern)`

`pattern` accepts `{ domain? , variant? , code? }`.

### `NiceError.match(e, cases)`

Exhaustive match. Requires `_` fallback unless every variant is handled.

### `NiceError.pack(errors, options?)`

Bundle many errors into a single envelope.

### `NiceError.unpack(envelope, allowedDomains)`

Reverse of `pack`.

### `NiceError.groupByDomain(errors)`

Helper: group an array by `domain`.

### `NiceError.mergePacks(...packs)`

Combine multiple packs into one.

---

## Instance properties

```ts
class NiceErrorInstance<P> extends Error {
  readonly domain:  string
  readonly variant: string
  readonly code:    string        // `${domain}/${variant}`
  readonly payload: P
  readonly cause?:  unknown

  is(other: unknown): boolean
  toJSON(): object
}
```

---

## `type<T>()`

Type-only placeholder for payload shapes when you don't have runtime defaults:

```ts
import { type } from "@nice-code/error"

const Net = NiceError.domain("net", {
  Timeout: type<{ after: number; url: string }>(),
})
```

---

## `tryCatch(fn)`

Result-style wrapper. Returns `[error | null, value | null]`.

```ts
const [err, user] = await tryCatch(() => getUser(id))
```

---

## `assertNever(value)`

Exhaustiveness helper. Throws at runtime, errors at compile time if `value` isn't `never`.
