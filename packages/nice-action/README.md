# @nice-code/action

A fully-typed action-based RPC framework for TypeScript. Define actions once, execute them locally or over HTTP/WebSocket — same code, same types, everywhere.

## Why?

Modern apps split logic across server, client, and workers. Typed RPC frameworks help, but most still require separate client/server type definitions, custom serialization glue, and ad-hoc error handling. `@nice-code/action` solves this with:

- **One definition, every environment** — same action works locally, over HTTP, or WebSocket
- **Custom serialization baked in** — `Date`, `Map`, `Buffer` — define it once, it works across the wire automatically
- **Typed error unions** — declare which errors an action throws; TypeScript enforces handling them
- **Observable** — attach listeners for logging, analytics, or tracing with zero boilerplate

---

## Install

```bash
bun add @nice-code/action @nice-code/error valibot
```

---

## Core Concepts

Actions flow through three states:

```
NiceAction (definition) → NiceActionPrimed (input attached) → NiceActionResponse (result)
```

You mostly work with `NiceAction` and let the framework handle the rest.

---

## Quick Start

### 1. Define a domain and its actions

```typescript
import { createActionRootDomain, action } from "@nice-code/action";
import * as v from "valibot";

const root = createActionRootDomain({ domain: "app" });

const orderDomain = root.createChildDomain({
  domain: "order",
  actions: {
    placeOrder: action()
      .input({ schema: v.object({ items: v.array(v.string()), total: v.number() }) })
      .output({ schema: v.object({ orderId: v.string(), estimatedDelivery: v.string() }) }),

    cancelOrder: action()
      .input({ schema: v.object({ orderId: v.string(), reason: v.string() }) })
      .output({ schema: v.object({ refundAmount: v.number() }) }),
  },
});
```

### 2. Register handlers

```typescript
import { ActionHandler, createActionRuntime } from "@nice-code/action";

const handler = new ActionHandler()
  .forAction(orderDomain, "placeOrder", {
    execution: async (primed) => {
      const { items, total } = primed.input; // fully typed
      const order = await db.orders.create({ items, total });
      return primed.setResponse({
        orderId: order.id,
        estimatedDelivery: "2-3 business days",
      });
    },
  })
  .forAction(orderDomain, "cancelOrder", {
    execution: async (primed) => {
      const refund = await payments.refund(primed.input.orderId);
      return primed.setResponse({ refundAmount: refund.amount });
    },
  });

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
);
```

### 3. Execute

```typescript
const result = await orderDomain.action("placeOrder").execute({
  items: ["SKU-001", "SKU-002"],
  total: 49.99,
});
// result: { orderId: "ord_abc123", estimatedDelivery: "2-3 business days" }
```

---

## Typed Error Handling

Declare errors your action can throw — TypeScript tracks them through `executeSafe()`.

```typescript
import { err_auth, err_payment } from "@nice-code/common-errors";

const checkoutDomain = root.createChildDomain({
  domain: "checkout",
  actions: {
    pay: action()
      .input({ schema: v.object({ cartId: v.string(), cardToken: v.string() }) })
      .output({ schema: v.object({ receiptId: v.string() }) })
      .throws(err_auth, ["unauthenticated"])        // only this error from auth domain
      .throws(err_payment),                         // all payment errors
  },
});
```

```typescript
const result = await checkoutDomain.action("pay").executeSafe({
  cartId: "cart_xyz",
  cardToken: "tok_...",
});

if (!result.ok) {
  // result.error is a fully typed NiceError union
  result.error.handleWithSync([
    forId(err_auth, "unauthenticated", () => res.status(401).json({ error: "Login required" })),
    forId(err_payment, "card_declined", (err) => {
      const { last4 } = err.getContext();
      res.status(402).json({ error: `Card ending in ${last4} was declined` });
    }),
    forDomain(err_payment, () => res.status(402).json({ error: "Payment failed" })),
  ]);
  return;
}

// result.output: { receiptId: string }
res.json({ receiptId: result.output.receiptId });
```

---

## Custom Serialization

Non-JSON types — `Date`, `Map`, binary — need serialization for transport. Define it once on the schema; the framework handles it on both ends.

```typescript
const eventDomain = root.createChildDomain({
  domain: "event",
  actions: {
    schedule: action()
      .input(
        { schema: v.object({ name: v.string(), scheduledAt: v.date() }) },
        // serialize: Date → ISO string for the wire
        ({ name, scheduledAt }) => ({ name, iso: scheduledAt.toISOString() }),
        // deserialize: ISO string → Date on the other end
        ({ name, iso }) => ({ name, scheduledAt: new Date(iso) })
      )
      .output({ schema: v.object({ eventId: v.string() }) }),
  },
});
```

```typescript
// Client sends this:
await eventDomain.action("schedule").execute({
  name: "Team meeting",
  scheduledAt: new Date("2025-03-15T14:00:00Z"), // ← native Date
});

// Wire format (what actually travels over HTTP):
// { name: "Team meeting", iso: "2025-03-15T14:00:00.000Z" }

// Server receives native Date automatically — no manual parsing
handler.forAction(eventDomain, "schedule", {
  execution: async (primed) => {
    console.log(primed.input.scheduledAt instanceof Date); // true
    await calendar.create(primed.input.scheduledAt);
    return primed.setResponse({ eventId: "evt_..." });
  },
});
```

---

## Same Actions, Different Environments

The same domain definition works on both server (with handlers) and client (with remote transport). No code duplication.

### Server

```typescript
// server.ts
const handler = new ActionHandler().forDomain(orderDomain, {
  execution: async (primed) => {
    /* ... real DB logic ... */
  },
});

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([handler])
);

// One endpoint handles all actions
app.post("/actions", async (req, res) => {
  const result = await handler.handleWire(req.body);
  if (!result.handled) return res.status(404).end();
  res.json(result.response.toJsonObject());
});
```

### Client

```typescript
// client.ts — exact same domain, different runtime
import { ActionConnect, ConnectionConfig, createActionRuntime } from "@nice-code/action";

const connect = new ActionConnect(
  [new ConnectionConfig({ transports: [{ type: "http", url: "/actions" }] })],
  { requestTimeout: 30_000 }
).routeDomain(orderDomain);

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "browser" }).addHandlers([connect])
);

// Works exactly like local execution — goes over HTTP transparently
const result = await orderDomain.action("placeOrder").execute({
  items: ["SKU-001"],
  total: 29.99,
});
```

### WebSocket for real-time

```typescript
new ConnectionConfig({
  transports: [
    { type: "ws", url: "wss://api.example.com/ws" }, // persistent connection, no reconnect overhead
    { type: "http", url: "/actions" },               // fallback
  ],
})
```

---

## Observability

Attach listeners to any domain — fire for every action without modifying handlers.

```typescript
const unsubscribe = orderDomain.addActionListener({
  execution: (primed, { runtime }) => {
    logger.info(`[${runtime.name}] → ${primed.domain}::${primed.id}`, primed.input);
  },
  response: (response, { runtime }) => {
    const { result } = response;
    if (result.ok) {
      metrics.increment(`action.success`, { action: response.id });
    } else {
      metrics.increment(`action.error`, { action: response.id, error: result.error.id });
    }
  },
});

// Clean up when done
unsubscribe();
```

---

## Pattern Matching

When you receive an action and need to branch on its identity:

```typescript
import { matchAction } from "@nice-code/action";

await matchAction(incomingAction)
  .with({
    domain: orderDomain,
    id: "placeOrder",
    handler: async (action) => {
      // action narrowed to NiceAction<OrderDomain, "placeOrder">
      await notifyWarehouse(action.input);
    },
  })
  .with({
    domain: orderDomain,
    id: "cancelOrder",
    handler: async (action) => {
      await notifyCustomer(action.input.orderId);
    },
  })
  .otherwise(async (action) => {
    logger.warn(`Unhandled action: ${action.domain}::${action.id}`);
  })
  .runAsync();
```

---

## Wire Format

Every action state serializes to JSON — useful for logging, queuing, or replay:

```typescript
const primed = orderDomain.action("placeOrder").prime({ items: ["SKU-001"], total: 29.99 });

const wire = primed.toJsonObject();
// {
//   type: "primed",
//   domain: "order",
//   allDomains: ["order", "app"],
//   id: "placeOrder",
//   cuid: "abc123...",
//   timeCreated: 1704067200000,
//   timePrimed: 1704067201000,
//   input: { items: ["SKU-001"], total: 29.99 }
// }

// Reconstruct anywhere
const rehydrated = orderDomain.hydratePrimed(wire);
await rehydrated.execute(); // executes with original input
```

Store actions in a queue, ship them to a worker, execute on the other side — full round-trip with validation.

---

## Named Handlers (Tags)

Route different action types to different handlers — useful for auth tiers, feature flags, or test overrides.

```typescript
const adminHandler = new ActionHandler({ tag: "admin" })
  .forAction(userDomain, "deleteUser", {
    execution: async (primed) => { /* admin-only logic */ },
  });

const publicHandler = new ActionHandler()
  .forDomain(userDomain, { execution: handlePublicActions });

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" })
    .addHandlers([adminHandler, publicHandler])
);

// Use the tagged handler explicitly
await userDomain.action("deleteUser").execute(input, { tag: "admin" });
```

---

## API Reference

### Domain

| Method | Description |
|---|---|
| `createActionRootDomain({ domain })` | Create root domain |
| `root.createChildDomain({ domain, actions })` | Create child domain |
| `domain.action(id)` | Get action definition |
| `domain.addActionListener({ execution?, response? })` | Observe all actions; returns unsubscribe fn |
| `domain.hydratePrimed(wire)` | Reconstruct primed action from JSON |
| `domain.hydrateResponse(wire)` | Reconstruct response from JSON |

### Action

| Method | Description |
|---|---|
| `action.execute(input, meta?)` | Execute; throws on error |
| `action.executeSafe(input, meta?)` | Execute; returns `{ ok, output }` or `{ ok, error }` |
| `action.prime(input)` | Attach and validate input |
| `action.is(other)` | Type guard — check if action matches this definition |

### Schema Builder (`action()`)

| Method | Description |
|---|---|
| `.input({ schema }, serialize?, deserialize?)` | Declare input schema + optional serde |
| `.output({ schema }, serialize?, deserialize?)` | Declare output schema + optional serde |
| `.throws(errorDomain, [ids]?)` | Declare throwable errors (all or subset) |

### Handlers

| Class | Use case |
|---|---|
| `ActionHandler` | Local/same-process execution |
| `ActionConnect` | Remote execution over HTTP or WebSocket |

### ActionHandler

| Method | Description |
|---|---|
| `.forAction(domain, id, { execution, response? })` | Handle one action |
| `.forActionIds(domain, ids, { execution, response? })` | Handle a subset |
| `.forDomain(domain, { execution, response? })` | Handle all actions in domain |
| `.forDomainActionCases(domain, cases)` | Handle actions via case map |
| `.handleWire(body)` | Parse and dispatch raw JSON (for HTTP endpoints) |

### ActionConnect

| Method | Description |
|---|---|
| `.routeDomain(domain, route?)` | Route all domain actions remotely |
| `.routeAction(domain, id, route?)` | Route one action remotely |
| `.routeActionIds(domain, ids, route?)` | Route a subset remotely |
| `.disconnect()` | Close connections |
