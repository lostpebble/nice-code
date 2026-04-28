---
title: Quick start
description: Install, define your first error domain and action, and execute across a network in five minutes.
---

## Install

```bash
# bun
bun add @nice-code/error @nice-code/action valibot

# npm
npm i @nice-code/error @nice-code/action valibot
```

Both packages are standalone. Install only what you need.

---

## Part 1: Typed errors

### Define an error domain

```ts title="errors.ts"
import { defineNiceError, err } from "@nice-code/error"

export const err_user = defineNiceError({
  domain: "err_user",
  schema: {
    not_found: err<{ userId: string }>({
      message: ({ userId }) => `User ${userId} not found`,
      httpStatusCode: 404,
      context: { required: true },
    }),
    email_taken: err<{ email: string }>({
      message: ({ email }) => `Email ${email} is already taken`,
      httpStatusCode: 409,
      context: { required: true },
    }),
    unauthorized: err({
      message: "Unauthorized",
      httpStatusCode: 401,
    }),
  },
})
```

### Throw it

```ts title="lookup.ts"
import { err_user } from "./errors"

export async function getUser(userId: string) {
  const user = await db.findUser(userId)
  if (!user) throw err_user.fromId("not_found", { userId })
  return user
}
```

### Catch and route it — typed

```ts title="handler.ts"
import { castNiceError, forDomain, forId } from "@nice-code/error"
import { err_user } from "./errors"

try {
  await getUser(req.params.id)
} catch (e) {
  const error = castNiceError(e)
  const handled = error.handleWithSync([
    forId(err_user, "not_found", (h) => {
      // h.getContext("not_found"): { userId: string } — fully typed
      return res.status(404).json({ userId: h.getContext("not_found").userId })
    }),
    forDomain(err_user, (h) => res.status(h.httpStatusCode).json({ error: h.message })),
  ])
  if (!handled) throw e
}
```

### Send it across the wire

```ts title="server.ts"
// Serialize: error survives JSON round-trip intact
catch (e) {
  const error = castNiceError(e)
  return new Response(error.toJsonString(), {
    status: error.httpStatusCode,
    headers: { "Content-Type": "application/json" },
  })
}
```

```ts title="client.ts"
import { castNiceError, forId } from "@nice-code/error"
import { err_user } from "./errors"

const res = await fetch(`/api/user/${userId}`)
if (!res.ok) {
  const error = castNiceError(await res.json())
  if (err_user.isExact(error)) {
    const hydrated = err_user.hydrate(error)
    if (hydrated.hasId("not_found")) {
      // Fully typed again on the client
      console.log("User not found:", hydrated.getContext("not_found").userId)
    }
  }
}
```

---

## Part 2: Typed actions

### Define an action domain

```ts title="domains.ts"
import { createActionRootDomain, action } from "@nice-code/action"
import * as v from "valibot"
import { err_user } from "./errors"

export const root = createActionRootDomain({ domain: "app" })

export const userDomain = root.createChildDomain({
  domain: "user",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) })
      .throws(err_user, ["not_found"] as const),

    createUser: action()
      .input({ schema: v.object({ name: v.string(), email: v.string() }) })
      .output({ schema: v.object({ id: v.string() }) })
      .throws(err_user, ["email_taken"] as const),
  },
})
```

### Register a handler (server side)

```ts title="server.ts"
import { ActionHandler, createActionRuntime } from "@nice-code/action"
import { root, userDomain } from "./domains"
import { err_user } from "./errors"

const handler = new ActionHandler()
  .forAction(userDomain, "getUser", {
    execution: async (primed) => {
      const user = await db.findUser(primed.input.userId)  // input is typed
      if (!user) throw err_user.fromId("not_found", { userId: primed.input.userId })
      return primed.setResponse(user)  // output is type-checked
    },
  })
  .forAction(userDomain, "createUser", {
    execution: async (primed) => {
      const exists = await db.emailExists(primed.input.email)
      if (exists) throw err_user.fromId("email_taken", { email: primed.input.email })
      const user = await db.createUser(primed.input)
      return primed.setResponse({ id: user.id })
    },
  })

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
)

// One endpoint handles all actions
app.post("/api/actions", async (req, res) => {
  const { handled, response } = await handler.handleWire(req.body)
  if (!handled) return res.status(404).end()
  res.json(response.toJsonObject())
})
```

### Connect and call from the client

```ts title="client.ts"
import { ActionConnect, ConnectionConfig, createActionRuntime } from "@nice-code/action"
import { root, userDomain } from "./domains"

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "browser" }).addHandlers([
    new ActionConnect(
      [new ConnectionConfig({ transports: [{ type: "http", url: "/api/actions" }] })],
      { requestTimeout: 15_000 }
    ).routeDomain(userDomain),
  ])
)

// Identical to local execution — goes over HTTP automatically
const result = await userDomain.action("getUser").executeSafe({ userId: "u1" })

if (!result.ok) {
  result.error.handleWithSync([
    forId(err_user, "not_found", (h) => {
      console.error("Not found:", h.getContext("not_found").userId)
    }),
  ])
  return
}

console.log(result.output.name)  // typed: { id: string; name: string }
```

---

## Next

- [Error domains](/nice-error/domains/) — full domain API
- [Handling errors](/nice-error/handling/) — pattern matching
- [Action domains](/nice-action/domains/) — domain creation and the `action()` builder
- [Handlers](/nice-action/requesters/) — `ActionHandler` setup
- [Remote Transport](/nice-action/resolvers/) — `ActionConnect` over HTTP and WebSocket
