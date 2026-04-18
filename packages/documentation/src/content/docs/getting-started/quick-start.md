---
title: Quick start
description: Install, declare your first error domain, and throw a typed error in under two minutes.
---

## Install

```bash
# bun
bun add @nice-code/error @nice-code/action

# npm
npm i @nice-code/error @nice-code/action

# pnpm
pnpm add @nice-code/error @nice-code/action
```

Both packages are standalone. Install only what you need.

## Your first error domain

```ts title="errors.ts"
import { NiceError } from "@nice-code/error"

export const UserError = NiceError.domain("user", {
  NotFound: { id: "" },
  EmailTaken: { email: "" },
  Disabled: { id: "", reason: "" },
})
```

Every key becomes a subclass. Payloads are typed from the shape you give.

## Throw it

```ts title="lookup.ts"
import { UserError } from "./errors"

export function getUser(id: string) {
  const user = users.find((u) => u.id === id)
  if (!user) {
    throw new UserError.NotFound({ id })
  }
  return user
}
```

## Catch it — typed

```ts title="handler.ts"
try {
  getUser(req.params.id)
} catch (e) {
  if (UserError.NotFound.is(e)) {
    // e.payload.id is typed as string
    return Response.json({ id: e.payload.id }, { status: 404 })
  }
  throw e
}
```

## Send it across the wire

```ts title="server.ts"
catch (e) {
  if (NiceError.is(e)) {
    return new Response(NiceError.serialize(e), { status: 400 })
  }
}
```

```ts title="client.ts"
const res = await fetch("/api/user/42")
if (!res.ok) {
  const err = NiceError.deserialize(await res.text(), [UserError])
  if (UserError.NotFound.is(err)) {
    // Fully typed again on the client side
  }
}
```

That's the whole library, in miniature.

## Next

- [Error domains](/nice-error/domains/) — full API
- [Wire format](/nice-action/wire-format/) — how actions serialize
- [Recipes](/reference/core/) — real-world patterns
