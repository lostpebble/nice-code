---
title: Resolvers
description: Implement action handlers on the server with a typed context.
---

A **resolver** is the server-side implementation of one action.

```ts
import { Billing } from "@/actions/billing"

export const resolvers = Billing.resolvers({
  getInvoice: async ({ id }, ctx) => {
    const inv = await ctx.db.invoice(id)
    if (!inv) throw new BillingError.InvoiceNotFound({ id })
    return inv
  },
})
```

`resolvers()` is type-checked against the domain. Missing actions, wrong inputs, wrong return types all fail at compile time.

## Context

Context is everything your resolvers need: the current user, a db handle, a logger, a request object. You define it.

```ts
export type Ctx = {
  db: Db
  user?: User
  requireUser: () => User
  logger: Logger
}

export const resolvers = Billing.resolvers({ /* … */ })
```

Context is produced per-request by your handler:

```ts title="server/handle.ts"
import { handleAction } from "@nice-code/action/server"
import { resolvers } from "./billing-resolvers"

export async function POST(req: Request): Promise<Response> {
  const ctx: Ctx = {
    db,
    user: await getUser(req),
    requireUser: () => {
      if (!ctx.user) throw new AuthError.NotSignedIn()
      return ctx.user
    },
    logger,
  }

  return handleAction(req, { domain: Billing, resolvers, ctx })
}
```

## Throwing typed errors

Only errors declared in the domain's `errors` array serialize to the client:

```ts
const Billing = NiceAction.domain("billing", {
  errors: [BillingError, AuthError],      // ← these round-trip
  actions: { /* … */ },
})
```

Throwing anything else — a raw `Error`, a `TypeError` — results in a generic 500 on the wire. Always throw nice-errors for anything the client needs to handle.

## Middleware

Resolvers can share cross-cutting concerns via middleware:

```ts
const requireAuth: ResolverMiddleware<Ctx> = async (args, ctx, next) => {
  if (!ctx.user) throw new AuthError.NotSignedIn()
  return next(args, ctx)
}

export const resolvers = Billing.resolvers({ /* … */ }, {
  middleware: [requireAuth, rateLimit(), withLogger()],
})
```

## Composing multiple domains

```ts title="server/router.ts"
import { createRouter } from "@nice-code/action/server"

export const router = createRouter({
  "/api/billing": { domain: Billing, resolvers: billingResolvers },
  "/api/auth":    { domain: Auth,    resolvers: authResolvers },
  "/api/users":   { domain: Users,   resolvers: userResolvers },
})

// in your framework
app.all("/api/*", (req) => router.handle(req, makeCtx(req)))
```
