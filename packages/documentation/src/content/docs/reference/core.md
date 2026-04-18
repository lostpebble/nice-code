---
title: Core recipes
description: Real-world patterns for combining nice-code with common stacks.
---

## With Next.js route handlers

```ts title="app/api/billing/route.ts"
import { handleAction } from "@nice-code/action/server"
import { Billing, billingResolvers } from "@/actions/billing"

export async function POST(req: Request) {
  return handleAction(req, {
    domain: Billing,
    resolvers: billingResolvers,
    ctx: { /* your context */ },
  })
}
```

## With Hono

```ts title="server.ts"
import { Hono } from "hono"
import { router } from "@/actions/router"

const app = new Hono()
app.all("/api/*", (c) => router.handle(c.req.raw, makeCtx(c)))
export default app
```

## With React Query

```ts title="use-billing.ts"
import { useQuery, useMutation } from "@tanstack/react-query"
import { billing } from "@/client/billing"

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: ["invoice", id],
    queryFn: () => billing.getInvoice({ id }),
  })

export const useChargeCard = () =>
  useMutation({
    mutationFn: billing.chargeCard,
    onError: (err) => {
      if (BillingError.NoCardOnFile.is(err)) openAddCardSheet()
    },
  })
```

## Mapping to HTTP status codes

```ts
const HttpError = NiceError.domain("http", {
  BadRequest:   {},
  Unauthorized: {},
  Forbidden:    {},
  NotFound:     {},
  Conflict:     {},
  RateLimited:  { retryAfter: 0 },
}, {
  httpStatus: {
    BadRequest: 400, Unauthorized: 401, Forbidden: 403,
    NotFound: 404, Conflict: 409, RateLimited: 429,
  },
})

const Billing = NiceError.domain("billing", { /* ... */ }, {
  extends: HttpError.BadRequest,
})
```

## Logging + tracing middleware

```ts
const traced: ResolverMiddleware<Ctx> = async (args, ctx, next) => {
  const span = tracer.start(ctx.action)
  try {
    return await next(args, ctx)
  } catch (e) {
    if (NiceError.is(e)) {
      span.setTag("error.domain", e.domain)
      span.setTag("error.variant", e.variant)
    }
    throw e
  } finally {
    span.end()
  }
}
```

## Retry only idempotent actions

```ts
const idempotent = new Set(["getInvoice", "listInvoices"])

createRequester(Billing, {
  middleware: [
    async (req, next) => {
      if (!idempotent.has(req.action)) return next(req)
      return retryWithBackoff(() => next(req), { times: 3 })
    },
  ],
})
```

## Validating input at the edge

Pair with Valibot or Zod. Run the validator _before_ `handleAction`:

```ts
import * as v from "valibot"

const InputSchema = v.object({ id: v.string() })

export async function POST(req: Request) {
  const raw = await req.clone().json()
  const parsed = v.safeParse(InputSchema, raw.input)
  if (!parsed.success) {
    throw new ValidationError.Field({
      field: parsed.issues[0].path?.[0]?.key as string,
      rule: parsed.issues[0].type,
    })
  }
  return handleAction(req, { /* ... */ })
}
```

## Testing resolvers in-process

```ts
import { inProcess } from "@nice-code/action/test"

const billing = inProcess(Billing, billingResolvers, () => ({
  user: fakeUser,
  db: memoryDb,
}))

const invoice = await billing.getInvoice({ id: "inv_1" })
```

No HTTP, no mocks — just functions.
