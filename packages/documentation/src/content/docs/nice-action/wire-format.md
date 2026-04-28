---
title: Wire format
description: The exact JSON shape of primed actions and responses, and how to serialize and reconstruct them.
---

Every action state serializes to a plain JSON object. Serialize with `.toJsonObject()`, reconstruct with `domain.hydratePrimed()` / `domain.hydrateResponse()`. This is the same format `ActionConnect` sends over HTTP and WebSocket, and what `ActionHandler.handleWire` expects to receive.

## Action states

Actions flow through three states, each with a matching wire shape:

| State | `type` field | Created by |
|---|---|---|
| Empty | `"empty"` | `domain.action(id)` |
| Primed | `"primed"` | `.prime(input)` |
| Resolved | `"resolved"` | After execution |

## Primed action (client → server)

```json
{
  "type": "primed",
  "domain": "user",
  "allDomains": ["user", "app"],
  "id": "getUser",
  "cuid": "V1StGXR8Z5jdHi6B",
  "timeCreated": 1700000000000,
  "timePrimed": 1700000001000,
  "input": { "userId": "u1" }
}
```

| Field | Type | Notes |
|---|---|---|
| `type` | `"primed"` | Discriminant for the wire format. |
| `domain` | `string` | The leaf domain name. |
| `allDomains` | `string[]` | Full ancestry chain, leaf first. |
| `id` | `string` | Action ID — must exist in the domain. |
| `cuid` | `string` | Unique correlation ID (nanoid). Stable across all three states. |
| `timeCreated` | `number` | Unix ms when the action was created. |
| `timePrimed` | `number` | Unix ms when `prime()` was called. |
| `input` | `object` | Serialized via the schema's `serialize` function (or as-is if none). |

## Resolved response (server → client)

**Success:**

```json
{
  "type": "resolved",
  "domain": "user",
  "allDomains": ["user", "app"],
  "id": "getUser",
  "cuid": "V1StGXR8Z5jdHi6B",
  "timeCreated": 1700000000000,
  "timePrimed": 1700000001000,
  "timeResponded": 1700000002000,
  "ok": true,
  "output": { "id": "u1", "name": "Alice" }
}
```

**Failure:**

```json
{
  "type": "resolved",
  "domain": "user",
  "allDomains": ["user", "app"],
  "id": "getUser",
  "cuid": "V1StGXR8Z5jdHi6B",
  "timeCreated": 1700000000000,
  "timePrimed": 1700000001000,
  "timeResponded": 1700000002000,
  "ok": false,
  "error": {
    "name": "NiceError",
    "def": { "domain": "err_user", "allDomains": ["err_user"] },
    "ids": ["not_found"],
    "errorData": {
      "not_found": {
        "contextState": { "kind": "serde_unset", "value": { "userId": "u1" } },
        "message": "User u1 not found",
        "httpStatusCode": 404,
        "timeAdded": 1700000002000
      }
    },
    "message": "User u1 not found",
    "httpStatusCode": 404,
    "wasntNice": false,
    "timeCreated": 1700000002000
  }
}
```

The `cuid` is identical across request and response — use it for correlation and deduplication.

## Serialization round-trip

```ts
// Client: create and serialize
const primed = userDomain.action("getUser").prime({ userId: "u1" })
const wire = primed.toJsonObject()  // INiceActionPrimed_JsonObject

// Send over HTTP
const rawResponse = await fetch("/api/actions", {
  method: "POST",
  body: JSON.stringify(wire),
  headers: { "Content-Type": "application/json" },
}).then(r => r.json())

// Client: reconstruct the response
const response = userDomain.hydrateResponse(rawResponse)
if (response.result.ok) {
  response.result.output  // typed as { id: string; name: string }
}

// Server: hydrate and execute
const primedAction = userDomain.hydratePrimed(wire)
const result = await primedAction.executeSafe()
// result.toJsonObject() → TNiceActionResponse_JsonObject
```

When using `ActionConnect`, all of this is automatic — you just call `execute()`.

## Custom input/output serialization

When input or output types are not JSON-safe, attach `serialize`/`deserialize` hooks to the schema. The wire carries the serialized form; the handler receives the deserialized value.

```ts
// Schema definition
const scheduleDomain = root.createChildDomain({
  domain: "schedule",
  actions: {
    create: action().input(
      { schema: v.object({ name: v.string(), at: v.date() }) },
      ({ name, at }) => ({ name, iso: at.toISOString() }),  // → wire
      ({ name, iso }) => ({ name, at: new Date(iso) })      // ← from wire
    ),
  },
})
```

Wire input:
```json
{ "name": "Team meeting", "iso": "2025-03-15T14:00:00.000Z" }
```

Handler receives:
```ts
primed.input.at  // Date — not a string
```

## Type guards

Check an unknown value before hydrating:

```ts
import { isPrimedActionJsonObject, isActionResponseJsonObject } from "@nice-code/action"

if (isPrimedActionJsonObject(body)) {
  const primed = userDomain.hydratePrimed(body)
}

if (isActionResponseJsonObject(body)) {
  const response = userDomain.hydrateResponse(body)
}
```

## Using wire format for queues and replay

The wire format is durable — store it, ship it to a worker, hydrate and execute later:

```ts
// Enqueue
const primed = orderDomain.action("processOrder").prime({ orderId: "ord_123" })
await queue.push(JSON.stringify(primed.toJsonObject()))

// Worker
const wire = JSON.parse(await queue.pop())
const primed = orderDomain.hydratePrimed(wire)
const response = await primed.executeToResponse()
await queue.pushResponse(JSON.stringify(response.toJsonObject()))
```

Input validation runs again on `hydratePrimed` — the schema is the contract.
