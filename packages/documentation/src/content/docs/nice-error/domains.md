---
title: Error domains
description: Declare a family of typed errors once, with shared identity.
---

An **error domain** is a namespace of related errors declared in a single call.

```ts
import { NiceError } from "@nice-code/error"

export const AuthError = NiceError.domain("auth", {
  NotSignedIn:    {},
  SessionExpired: { expiredAt: new Date() },
  Forbidden:      { scope: "" },
  RateLimited:    { retryAfter: 0 },
})
```

The first argument is the domain **name**. It becomes part of the error's identity, so two codebases can use the same variant name (`NotFound`) without colliding.

The second argument is a map of **variants** to their payload shape. Types are inferred from the _values_ you pass.

## What you get back

`NiceError.domain()` returns an object where each key is a constructable error class:

```ts
new AuthError.Forbidden({ scope: "billing.write" })
new AuthError.SessionExpired({ expiredAt: new Date() })
new AuthError.NotSignedIn()   // no payload needed
```

Each class also carries helpers:

```ts
AuthError.Forbidden.is(e)     // type guard
AuthError.Forbidden.code      // "auth/Forbidden"
AuthError.Forbidden.domain    // "auth"
AuthError.Forbidden.variant   // "Forbidden"
```

## Properties on an instance

```ts
const e = new AuthError.Forbidden({ scope: "billing.write" })

e.domain   // "auth"
e.variant  // "Forbidden"
e.code     // "auth/Forbidden"
e.payload  // { scope: "billing.write" }
e.message  // human-readable, generated from variant + payload
e.cause    // standard Error cause (optional second arg)
```

## Inference

Payload types come from the shape you pass. Use `undefined` for optional keys:

```ts
const NetError = NiceError.domain("net", {
  Timeout: { after: 0, url: "" },
  Offline: { hint: undefined as string | undefined },
})
```

For fully-typed payloads with no placeholder values, use `type<T>()`:

```ts
import { NiceError, type } from "@nice-code/error"

const NetError = NiceError.domain("net", {
  Timeout: type<{ after: number; url: string }>(),
  Offline: type<{ hint?: string }>(),
})
```

## Naming conventions

- **Domain**: lowercase, kebab-case. Reflects the bounded context: `"auth"`, `"billing"`, `"graph.ingest"`.
- **Variant**: PascalCase. Reads like a predicate: `NotFound`, `AlreadyExists`, `RateLimited`.
- **Code**: always `domain/Variant`. Never construct it manually; use `.code`.
