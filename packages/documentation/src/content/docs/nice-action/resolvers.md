---
title: Resolvers & Environments
description: Register local resolver functions and multi-domain responder environments.
---

A **resolver** is a simpler alternative to a requester when the execution logic lives in the same process. Instead of routing through a handler, you register per-action functions directly on the domain.

## `createDomainResolver`

```ts
import { createDomainResolver } from "@nice-code/action";

user_domain.registerResponder(
  createDomainResolver(user_domain)
    .resolveAction("getUser", ({ userId }) => db.findUser(userId))
    .resolveAction("deleteUser", ({ userId }) => db.deleteUser(userId)),
);

// Now execute() works without a separate requester
const user = await user_domain.action("getUser").execute({ userId: "u1" });
```

### `.resolveAction(id, fn)`

Registers a function for a specific action ID. The function receives the deserialized input and returns the output (sync or async):

```ts
createDomainResolver(user_domain)
  .resolveAction("getUser", async ({ userId }) => {
    const user = await db.findUser(userId);
    if (!user) throw err_user.fromId("not_found");
    return user;
  })
```

`resolveAction` returns the same resolver instance so calls can be chained.

## Named resolver environments

Register a resolver under an `envId` to target it explicitly:

```ts
user_domain.registerResponder(
  createDomainResolver(user_domain)
    .resolveAction("getUser", ({ userId }) => remoteDb.findUser(userId))
    .resolveAction("deleteUser", ({ userId }) => remoteDb.deleteUser(userId)),
  { envId: "remote" },
);

await user_domain.action("getUser").execute({ userId: "u1" }, "remote");
```

Multiple named environments can coexist. Each has independent resolver registrations.

## `createResponderEnvironment` — multi-domain dispatch

When you have multiple domains and want a single entry point for all of them (e.g. a worker or edge function that handles requests), create a responder environment:

```ts
import { createDomainResolver, createResponderEnvironment } from "@nice-code/action";

const env = createResponderEnvironment([
  createDomainResolver(user_domain)
    .resolveAction("getUser", ({ userId }) => db.findUser(userId))
    .resolveAction("deleteUser", ({ userId }) => db.deleteUser(userId)),
  createDomainResolver(order_domain)
    .resolveAction("placeOrder", ({ sku, qty }) => db.placeOrder(sku, qty)),
]);

// Receive a serialized primed action, dispatch it, return a serialized response
const wireResponse = await env.dispatch(primedActionJson);
```

`env.dispatch(wire)` deserializes the primed action, routes it to the correct domain resolver, and returns a serialized response object (`{ domain, id, ok, output? | error? }`).

Errors thrown by resolver functions are caught and returned as `{ ok: false, error: <serialized NiceError> }`.

## Hydrating the response on the client side

```ts
const serializedResponse = await env.dispatch(wire);

// Hydrate back to typed NiceActionResponse
const response = user_domain.hydrateResponse(serializedResponse);

if (response.result.ok) {
  response.result.output; // { id: string; name: string } — fully typed
} else {
  response.result.error.handleWith([...]);
}
```

## Full round-trip example

```ts
// Client side
const primed = user_domain.action("getUser").prime({ userId: "u1" });
const wire = JSON.parse(JSON.stringify(primed.toJsonObject())); // simulate transport

// Server side
const env = createResponderEnvironment([
  createDomainResolver(user_domain)
    .resolveAction("getUser", ({ userId }) => db.findUser(userId))
    .resolveAction("deleteUser", ({ userId }) => db.deleteUser(userId)),
]);
const wireResponse = await env.dispatch(wire);

// Client side — hydrate the response
const response = user_domain.hydrateResponse(wireResponse);
if (response.result.ok) {
  console.log(response.result.output.name);
}
```

## Error behavior

- `resolver_action_not_registered` — a resolver function was not registered for the action ID
- `resolver_domain_not_registered` — the dispatched domain has no resolver in the environment
- `environment_already_registered` — same `envId` registered twice
