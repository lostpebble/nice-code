---
title: Wire Format
description: Serialize actions and responses for transport across processes, workers, or HTTP.
---

Actions and their responses serialize to plain JSON objects. This makes them suitable for HTTP, RPC, message queues, and worker boundaries.

## Primed action wire format

A primed action (action + input) serializes to:

```json
{
  "domain": "user_domain",
  "allDomains": ["user_domain"],
  "id": "getUser",
  "input": { "userId": "u1" }
}
```

### Serializing

```ts
const primed = user_domain.action("getUser").prime({ userId: "u1" });

const obj  = primed.toJsonObject();  // plain object
const json = primed.toJsonString();  // JSON string
```

### Deserializing (hydrating)

```ts
const hydrated = user_domain.hydrateAction(wireObj);

// hydrated.input is typed — execute it
const result = await hydrated.executeSafe();
```

`hydrateAction` validates that the domain and action ID match the domain it's called on. Mismatches throw `hydration_domain_mismatch` or `hydration_action_id_not_found`.

## Response wire format

After dispatch, a response serializes to:

```json
// Success
{
  "domain": "user_domain",
  "allDomains": ["user_domain"],
  "id": "getUser",
  "ok": true,
  "output": { "id": "u1", "name": "Alice" }
}

// Failure
{
  "domain": "user_domain",
  "allDomains": ["user_domain"],
  "id": "getUser",
  "ok": false,
  "error": {
    "domain": "err_user",
    "ids": [{ "id": "not_found" }],
    "message": "User not found",
    "httpStatusCode": 404
  }
}
```

### Hydrating a response

```ts
const response = user_domain.hydrateResponse(wireResponse);

if (response.result.ok) {
  response.result.output;  // typed output
} else {
  response.result.error;   // NiceError
}
```

## Custom serialization for non-JSON types

When input or output contains types that don't survive JSON serialization (e.g. `Date`, `Map`, class instances), attach hooks to the action schema:

```ts
const schedule_domain = createActionDomain({
  domain: "schedule_domain",
  actions: {
    schedule: action()
      .input({
        schema: v.object({ at: v.date() }),
        serialization: {
          serialize:   ({ at }) => ({ iso: at.toISOString() }),
          deserialize: (s: { iso: string }) => ({ at: new Date(s.iso) }),
        },
      })
      .output({
        schema: v.object({ confirmed: v.boolean() }),
        // No custom serde needed — boolean is JSON-native
      }),
  },
});
```

- **`serialize`** — converts your typed input to a JSON-safe form before transport
- **`deserialize`** — reconstructs the typed value on the receiving side

The handler always receives the deserialized value. The serialized form only appears on the wire.

## Complete transport simulation

```ts
// Sender
const primed = schedule_domain.action("schedule").prime({ at: new Date() });
const wire = JSON.stringify(primed.toJsonObject()); // send over network

// Receiver
const env = createResponderEnvironment([
  createDomainResolver(schedule_domain)
    .resolveAction("schedule", ({ at }) => {
      // at is a proper Date — not a string
      return { confirmed: true };
    }),
]);

const wireObj = JSON.parse(wire);
const wireResponse = await env.dispatch(wireObj);
const response = schedule_domain.hydrateResponse(wireResponse);
```

## `isActionResponseJsonObject` and `isPrimedActionJsonObject`

Type guards for validating wire payloads before hydrating:

```ts
import { isPrimedActionJsonObject, isActionResponseJsonObject } from "@nice-code/action";

if (isPrimedActionJsonObject(body)) {
  const hydrated = user_domain.hydrateAction(body);
}

if (isActionResponseJsonObject(body)) {
  const response = user_domain.hydrateResponse(body);
}
```
