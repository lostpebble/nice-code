---
title: Handlers
description: Register execution logic for actions with ActionHandler and ActionRuntimeEnvironment.
---

A **handler** is the execution implementation for one or more actions. You register handlers into a runtime environment, then attach the environment to the root domain. From that point, `execute()` on any action routes through the registered handlers.

## Setup

```ts
import { ActionHandler, createActionRuntime } from "@nice-code/action"

const handler = new ActionHandler()
  .forAction(userDomain, "getUser", {
    execution: async (primed) => {
      const user = await db.findUser(primed.input.userId)  // input is typed
      if (!user) throw err_user.fromId("not_found", { userId: primed.input.userId })
      return primed.setResponse(user)  // output is type-checked against schema
    },
  })

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
)
```

`createActionRuntime` creates a `ActionRuntimeEnvironment`. `addHandlers` registers one or more `IActionHandler` instances. `setRuntimeEnvironment` binds it to the root domain — only one environment per root.

## Registration methods

### `forAction` — one specific action

```ts
new ActionHandler().forAction(userDomain, "deleteUser", {
  execution: async (primed) => {
    // primed.input: { userId: string }
    await db.deleteUser(primed.input.userId)
    return primed.setResponse(undefined)
  },
})
```

### `forActionIds` — a named subset

```ts
new ActionHandler().forActionIds(userDomain, ["getUser", "listUsers"] as const, {
  execution: async (primed) => {
    // primed.input is the union of getUser + listUsers input types
    // Use primed.id to discriminate at runtime
    if (primed.id === "getUser") { ... }
  },
})
```

### `forDomain` — all actions in a domain

```ts
new ActionHandler().forDomain(userDomain, {
  execution: async (primed) => {
    // primed is the union of all domain actions
    // Use primed.id to route
  },
})
```

### `forDomainActionCases` — case map (most readable for many actions)

```ts
new ActionHandler().forDomainActionCases(userDomain, {
  getUser: {
    execution: async (primed) => {
      return primed.setResponse(await db.findUser(primed.input.userId))
    },
  },
  deleteUser: {
    execution: async (primed) => {
      await db.deleteUser(primed.input.userId)
      return primed.setResponse(undefined)
    },
  },
})
```

Each key is an action ID; each value has `execution` (and optionally `response`).

## Execution function return values

The `execution` function can return:

| Return | Meaning |
|---|---|
| `primed.setResponse(output)` | Wrap a successful output in a `NiceActionResponse` |
| `primed.errorResponse(error)` | Wrap a typed error in a `NiceActionResponse` |
| Raw `output` value | Automatically wrapped as a success response |
| `undefined` | No response generated — framework continues looking |

Throwing an error from inside `execution` is also valid — it propagates as `{ ok: false, error }` via `executeSafe`.

## Response interceptors

Handlers can also define a `response` function that fires after execution, letting you inspect or transform the result:

```ts
new ActionHandler().forAction(userDomain, "getUser", {
  execution: async (primed) => {
    return primed.setResponse(await db.findUser(primed.input.userId))
  },
  response: async (response, { tag, runtime }) => {
    // Log, transform, or audit the response
    if (response.result.ok) {
      cache.set(response.primed.input.userId, response.result.output)
    }
    return response  // pass through unchanged
  },
})
```

## Multiple handlers

Multiple handlers can be registered in one environment. The first handler whose registration matches the action wins:

```ts
const adminHandler = new ActionHandler({ tag: "admin" })
  .forAction(userDomain, "deleteUser", { execution: adminDeleteUser })

const publicHandler = new ActionHandler()
  .forDomain(userDomain, { execution: handleUserAction })
  .forDomain(orderDomain, { execution: handleOrderAction })

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([adminHandler, publicHandler])
)
```

## Named tags

Register a handler under a tag and target it at call time. Useful for admin/user separation, feature flags, or test overrides:

```ts
const adminHandler = new ActionHandler({ tag: "admin" })
  .forAction(userDomain, "deleteUser", { execution: ... })

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([adminHandler, defaultHandler])
)

// Target the tagged handler
await userDomain.action("deleteUser").execute({ userId: "u1" }, { tag: "admin" })
```

## Handling the wire format (HTTP endpoint)

`handleWire` parses an unknown request body and dispatches it if any handler matches:

```ts
// One endpoint handles all actions
app.post("/actions", async (req, res) => {
  const result = await handler.handleWire(req.body)

  if (!result.handled) {
    return res.status(404).json({ error: "Unknown action" })
  }

  // result.response is a NiceActionResponse — serialize it for the client
  res.json(result.response.toJsonObject())
})
```

`handleWire` returns `{ handled: boolean; response?: NiceActionResponse }`.

## Multiple domains on one endpoint

Register multiple handlers with different domain coverage and pass all requests through the same endpoint:

```ts
const handler = new ActionHandler()
  .forDomain(userDomain, { execution: handleUser })
  .forDomain(orderDomain, { execution: handleOrder })
  .forDomain(billingDomain, { execution: handleBilling })

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
)

app.post("/actions", async (req, res) => {
  const result = await handler.handleWire(req.body)
  if (!result.handled) return res.status(404).end()
  res.json(result.response.toJsonObject())
})
```
