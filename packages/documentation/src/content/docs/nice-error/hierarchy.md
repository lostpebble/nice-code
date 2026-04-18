---
title: Domain hierarchy
description: Compose domains into parent/child relationships for broad matching.
---

Error domains can **extend** each other. Use this when one layer's errors are a superset of another's.

```ts
const HttpError = NiceError.domain("http", {
  BadRequest:   { status: 400 },
  Unauthorized: { status: 401 },
  Forbidden:    { status: 403 },
})

const AuthError = NiceError.domain("auth", {
  NotSignedIn:    {},
  SessionExpired: { expiredAt: new Date() },
}, {
  extends: HttpError.Unauthorized,
})
```

Now `AuthError.NotSignedIn` and `AuthError.SessionExpired` both **satisfy** `HttpError.Unauthorized.is(e)`:

```ts
const e = new AuthError.SessionExpired({ expiredAt: new Date() })

AuthError.SessionExpired.is(e)  // true — exact
HttpError.Unauthorized.is(e)    // true — via hierarchy
HttpError.BadRequest.is(e)      // false
```

## Matching up the chain

```ts
try {
  await requireAuth()
} catch (e) {
  if (HttpError.Unauthorized.is(e)) {
    return redirect("/signin")
  }
  throw e
}
```

The handler doesn't need to know every auth variant. It just matches on the parent.

## Multiple layers

Extension is transitive:

```ts
const HttpError = NiceError.domain("http", { /* ... */ })
const AuthError = NiceError.domain("auth", { /* ... */ }, { extends: HttpError.Unauthorized })
const SsoError  = NiceError.domain("sso",  { /* ... */ }, { extends: AuthError.NotSignedIn })

const e = new SsoError.SamlFailed({ idp: "okta" })
AuthError.NotSignedIn.is(e)   // true
HttpError.Unauthorized.is(e)  // true
```

## When to use it

- Mapping your app's domain errors onto transport errors (HTTP status codes, gRPC codes).
- Matching groups of errors in middleware or centralized handlers.
- Letting library consumers write broad `catch` logic without knowing every variant you add.

> **Heads up:** extension is about _matching_, not _inheritance of payload_. Each variant's payload is still exactly what you declared.
