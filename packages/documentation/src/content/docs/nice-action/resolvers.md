---
title: Remote Transport
description: Dispatch actions to a remote server over HTTP or WebSocket with ActionConnect.
---

`ActionConnect` is the client-side counterpart to `ActionHandler`. Instead of running logic locally, it forwards primed actions to a remote server over HTTP or WebSocket and returns the typed response. From the call site, it looks identical to a local handler — `execute()` just works.

## Basic HTTP setup

```ts
import { ActionConnect, ConnectionConfig, createActionRuntime } from "@nice-code/action"

const connect = new ActionConnect(
  [
    new ConnectionConfig({
      transports: [{ type: "http", url: "https://api.example.com/actions" }],
    }),
  ],
  { requestTimeout: 30_000 }
)

connect.routeDomain(userDomain)

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "browser" }).addHandlers([connect])
)

// Now this sends a POST to https://api.example.com/actions automatically
const user = await userDomain.action("getUser").execute({ userId: "u1" })
```

## Route configuration

### `routeDomain` — route all actions in a domain

```ts
connect.routeDomain(userDomain)
connect.routeDomain(orderDomain)
```

### `routeAction` — route one specific action

```ts
connect.routeAction(orderDomain, "placeOrder")
```

### `routeActionIds` — route a named subset

```ts
connect.routeActionIds(orderDomain, ["getOrder", "cancelOrder"])
```

## Multiple transports (HTTP + WebSocket)

`ConnectionConfig` accepts multiple transports. `ActionConnect` uses the first ready transport for each request:

```ts
new ConnectionConfig({
  transports: [
    { type: "ws",   url: "wss://api.example.com/ws" },  // preferred: persistent, low latency
    { type: "http", url: "https://api.example.com/actions" },  // fallback
  ],
})
```

- **HTTP** (`TransportHttp`) — a fresh `fetch` POST per action. Stateless, works everywhere.
- **WebSocket** (`TransportWebSocket`) — a single persistent connection shared across all requests. Initializes lazily on first use. Responses are correlated by `cuid`.

## WebSocket detail

```ts
new ConnectionConfig({
  transports: [{ type: "ws", url: "wss://api.example.com/ws" }],
})
```

The WebSocket connection opens on the first request and stays open. Subsequent requests reuse it with no overhead. If the connection closes or errors, the transport transitions to `failed` and pending requests are rejected — fall back to HTTP by listing both transports.

## Multiple connections with named routes

Different actions can route to different backends:

```ts
const publicConnect = new ActionConnect(
  [new ConnectionConfig({ transports: [{ type: "http", url: "/api/actions" }] })],
  { requestTimeout: 10_000 }
)

const realtimeConnect = new ActionConnect(
  [new ConnectionConfig({ transports: [{ type: "ws", url: "wss://realtime.example.com/ws" }] })],
  { requestTimeout: 5_000 }
)

publicConnect
  .routeDomain(userDomain)
  .routeActionIds(orderDomain, ["getOrder", "listOrders"])

realtimeConnect
  .routeActionIds(orderDomain, ["trackOrder"])

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "browser" })
    .addHandlers([publicConnect, realtimeConnect])
)
```

## Server side

On the server, pair `ActionConnect` with an `ActionHandler` endpoint. The handler's `handleWire` method parses the incoming action and dispatches it:

```ts
// server.ts
import { ActionHandler, createActionRuntime } from "@nice-code/action"

const handler = new ActionHandler()
  .forDomain(userDomain, {
    execution: async (primed) => {
      const user = await db.findUser(primed.input.userId)
      return primed.setResponse(user)
    },
  })

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
)

// Single endpoint for all actions
app.post("/api/actions", async (req, res) => {
  const result = await handler.handleWire(req.body)
  if (!result.handled) return res.status(404).end()
  res.json(result.response.toJsonObject())
})
```

## Complete round-trip example

**Shared domain definition** (imported by both client and server):
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

const connect = new ActionConnect(
  [new ConnectionConfig({ transports: [{ type: "http", url: "/api/actions" }] })],
  { requestTimeout: 15_000 }
).routeDomain(userDomain)

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "browser" }).addHandlers([connect])
)

// Same call, goes over HTTP
const result = await userDomain.action("getUser").executeSafe({ userId: "u1" })
```

## Cleaning up

```ts
connect.disconnect()  // closes WebSocket connections, rejects pending requests
```
