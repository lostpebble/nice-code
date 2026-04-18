---
title: Multi-ID Errors
description: Stable error identity across processes, workers, and the wire.
---

Traditional errors are compared by reference. Two `new Error("oops")` are different objects. That's fine in-process, but falls apart the moment an error crosses a boundary.

nice-code gives every error a **multi-part stable identity**:

```
domain / variant / (optional discriminator)
```

Two errors with the same identity are treated as the _same error_ — even if one was thrown in a worker, serialized, and re-hydrated on the main thread.

## The identity tuple

```ts
NiceError.identity(e)
// => ["auth", "Forbidden", undefined]
```

For variants that need finer-grained identity, add a **discriminator**:

```ts
const ValidationError = NiceError.domain("validation", {
  Field: {
    field: "",
    rule: "",
  },
}, {
  discriminator: (e) => `${e.payload.field}:${e.payload.rule}`,
})

const a = new ValidationError.Field({ field: "email", rule: "format" })
const b = new ValidationError.Field({ field: "email", rule: "format" })

NiceError.equals(a, b)  // true — same field, same rule
```

## Why this matters

- **Deduplication**: deduplicate errors in toast notifications, log aggregators, or retry queues.
- **Matching across boundaries**: a `ValidationError.Field{field:email}` thrown on the server matches the same identity on the client.
- **Fingerprinting for analytics**: group errors in Sentry / Posthog by identity tuple, not by message or stack.

## Equality rules

```ts
NiceError.equals(a, b)
```

Returns `true` if:

1. `a.domain === b.domain`
2. `a.variant === b.variant`
3. Both discriminators match (or both are `undefined`)

Payloads are **not** compared. Two `NotFound` errors with different `id`s are the same _identity_ but different _instances_.

## Useful helpers

| Helper | Returns |
|---|---|
| `NiceError.identity(e)` | `[domain, variant, discriminator?]` |
| `NiceError.equals(a, b)` | `boolean` |
| `NiceError.code(e)` | `"domain/Variant"` |
| `NiceError.fingerprint(e)` | stable string, good for cache/log keys |
