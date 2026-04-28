---
title: Recipes
description: Real-world patterns for combining nice-code with common stacks.
---

## HTTP error handler (any framework)

```ts
import { castNiceError, forDomain, forId } from "@nice-code/error"
import { err_billing, err_auth } from "./errors"

async function handleRequest(req: Request): Promise<Response> {
  try {
    return await myHandler(req)
  } catch (e) {
    const error = castNiceError(e)
    return (
      error.handleWithSync([
        forId(err_auth, "unauthenticated", () => new Response("Unauthorized", { status: 401 })),
        forDomain(err_auth, (h) => new Response(h.message, { status: h.httpStatusCode })),
        forDomain(err_billing, (h) => new Response(h.message, { status: h.httpStatusCode })),
      ]) ?? error.toHttpResponse()
    )
  }
}
```

---

## Same-process actions (no network)

```ts
import { createActionRootDomain, action, ActionHandler, createActionRuntime } from "@nice-code/action"
import * as v from "valibot"

const root = createActionRootDomain({ domain: "app" })

const userDomain = root.createChildDomain({
  domain: "user",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) })
      .throws(err_user, ["not_found"] as const),
  },
})

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([
    new ActionHandler().forAction(userDomain, "getUser", {
      execution: async (primed) => {
        const user = await db.findUser(primed.input.userId)
        if (!user) throw err_user.fromId("not_found", { userId: primed.input.userId })
        return primed.setResponse(user)
      },
    }),
  ])
)

const result = await userDomain.action("getUser").executeSafe({ userId: "u1" })
```

---

## Actions over HTTP (client + server)

**Shared domain** (imported by both sides):

```ts
// shared/domains.ts
export const root = createActionRootDomain({ domain: "app" })
export const userDomain = root.createChildDomain({
  domain: "user",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) })
      .throws(err_user, ["not_found"] as const),
  },
})
```

**Server**:

```ts
import { root, userDomain } from "./shared/domains"
import { ActionHandler, createActionRuntime } from "@nice-code/action"

const handler = new ActionHandler().forAction(userDomain, "getUser", {
  execution: async (primed) => {
    const user = await db.findUser(primed.input.userId)
    if (!user) throw err_user.fromId("not_found", { userId: primed.input.userId })
    return primed.setResponse(user)
  },
})

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
)

app.post("/api/actions", async (req, res) => {
  const { handled, response } = await handler.handleWire(req.body)
  if (!handled) return res.status(404).end()
  res.json(response.toJsonObject())
})
```

**Client**:

```ts
import { root, userDomain } from "./shared/domains"
import { ActionConnect, ConnectionConfig, createActionRuntime } from "@nice-code/action"

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "browser" }).addHandlers([
    new ActionConnect(
      [new ConnectionConfig({ transports: [{ type: "http", url: "/api/actions" }] })],
      { requestTimeout: 15_000 }
    ).routeDomain(userDomain),
  ])
)

// Identical call — goes over HTTP automatically
const result = await userDomain.action("getUser").executeSafe({ userId: "u1" })
```

---

## Actions over WebSocket

Replace the HTTP transport with WebSocket for persistent, low-latency connections:

```ts
new ActionConnect(
  [
    new ConnectionConfig({
      transports: [
        { type: "ws",   url: "wss://api.example.com/ws" },  // primary
        { type: "http", url: "https://api.example.com/actions" },  // fallback
      ],
    }),
  ],
  { requestTimeout: 10_000 }
).routeDomain(userDomain)
```

---

## With React Query

```ts
import { useQuery, useMutation } from "@tanstack/react-query"
import { castNiceError, forId, forDomain } from "@nice-code/error"

export const useGetUser = (userId: string) =>
  useQuery({
    queryKey: ["user", userId],
    queryFn: () => userDomain.action("getUser").execute({ userId }),
  })

export const useDeleteUser = () =>
  useMutation({
    mutationFn: (userId: string) => userDomain.action("deleteUser").execute({ userId }),
    onError: (e) => {
      const error = castNiceError(e)
      error.handleWithSync([
        forId(err_user, "not_found", () => toast("User not found")),
        forDomain(err_auth, () => router.push("/login")),
      ])
    },
  })
```

---

## Hono + @nice-code/common-errors validation

```ts
import { Hono } from "hono"
import * as v from "valibot"
import { niceSValidator } from "@nice-code/common-errors/hono"
import { castNiceError, forDomain } from "@nice-code/error"
import { err_validation } from "@nice-code/common-errors"

const app = new Hono()

app.post(
  "/user",
  niceSValidator("json", v.object({ name: v.string(), email: v.pipe(v.string(), v.email()) })),
  async (c) => {
    const { name, email } = c.req.valid("json")
    return c.json({ name, email })
  }
)

app.onError((e, c) => {
  const error = castNiceError(e)
  return (
    error.handleWithSync([
      forDomain(err_validation, (h) => c.json({ error: h.message }, 400)),
    ]) ?? c.json({ error: "Internal error" }, 500)
  )
})
```

---

## Domain hierarchy for centralized error handling

```ts
const err_app = defineNiceError({ domain: "err_app", schema: {} })

const err_auth = err_app.createChildDomain({
  domain: "err_auth",
  schema: {
    unauthenticated: err({ message: "Unauthenticated", httpStatusCode: 401 }),
    forbidden:       err({ message: "Forbidden",       httpStatusCode: 403 }),
  },
})

const err_billing = err_app.createChildDomain({
  domain: "err_billing",
  defaultHttpStatusCode: 402,
  schema: {
    payment_failed: err<{ reason: string }>({
      message: ({ reason }) => `Payment failed: ${reason}`,
      context: { required: true },
    }),
  },
})

// Broad catch — works for any err_app descendant
const error = castNiceError(caught)
if (err_app.isThisOrChild(error)) {
  return new Response(error.message, { status: error.httpStatusCode })
}
```

---

## Cloudflare Durable Object boundary (packing)

```ts
import { EErrorPackType } from "@nice-code/error"

const err_durable = defineNiceError({
  domain: "err_durable",
  schema: {
    op_failed: err<{ reason: string }>({
      message: ({ reason }) => `Operation failed: ${reason}`,
      context: { required: true },
    }),
  },
})

// Pack at domain level — all errors are automatically embedded in message
err_durable.packAs(EErrorPackType.msg_pack)

// Inside a Durable Object method:
throw err_durable.fromId("op_failed", { reason: "lock contention" })

// Caller (stub boundary) — castNiceError unpacks automatically:
try {
  await stub.doWork()
} catch (e) {
  const error = castNiceError(e)
  error.handleWithSync([
    forDomain(err_durable, (h) => console.error("DO error:", h.message)),
  ])
}
```

---

## Error custom serialization round-trip

```ts
const err_order = defineNiceError({
  domain: "err_order",
  schema: {
    shipped: err<{ orderId: string; shippedAt: Date }>({
      message: ({ orderId }) => `Order ${orderId} has already shipped`,
      context: {
        required: true,
        serialization: {
          toJsonSerializable: ({ orderId, shippedAt }) => ({
            orderId,
            shippedAt: shippedAt.toISOString(),
          }),
          fromJsonSerializable: ({ orderId, shippedAt }) => ({
            orderId,
            shippedAt: new Date(shippedAt),
          }),
        },
      },
    }),
  },
})

// After receiving from the wire:
const error = castNiceError(await res.json())
if (err_order.isExact(error)) {
  const hydrated = err_order.hydrate(error)  // runs fromJsonSerializable
  if (hydrated.hasId("shipped")) {
    hydrated.getContext("shipped").shippedAt  // Date — fully restored
  }
}
```

---

## Observability with action listeners

```ts
// Attach once to the root's child domains — fires for every action
const unsubscribe = orderDomain.addActionListener({
  execution: (primed, { tag, runtime }) => {
    logger.info(`→ ${primed.domain}::${primed.id}`, { cuid: primed.cuid, input: primed.input })
  },
  response: (response, { tag, runtime }) => {
    const duration = response.timeResponded - response.primed.timePrimed
    if (response.result.ok) {
      metrics.timing("action.duration", duration, { id: response.id, status: "ok" })
    } else {
      metrics.timing("action.duration", duration, {
        id: response.id,
        status: "error",
        error: response.result.error.id,
      })
    }
  },
})
```
