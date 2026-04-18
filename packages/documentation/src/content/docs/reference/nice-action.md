---
title: "@nice-code/action — API reference"
description: The full public surface of @nice-code/action.
tableOfContents:
  maxHeadingLevel: 4
---

## `NiceAction`

### `NiceAction.domain(name, spec)`

| Param | Type | Description |
|---|---|---|
| `name` | `string` | Domain name (used in wire format). |
| `spec.errors` | `NiceErrorDomain[]` | Errors this domain can throw. |
| `spec.actions` | `Record<string, ActionDef>` | Action name → `{ input, output }`. |

Returns a `NiceActionDomain`.

### `NiceActionDomain#resolvers(impl, options?)`

Declare the server implementation.

| Param | Type | Description |
|---|---|---|
| `impl` | `Record<Action, Resolver>` | One handler per action. |
| `options.middleware` | `ResolverMiddleware[]` | Shared cross-cutting layers. |

Returns a `ResolverSet`.

### `NiceActionDomain#actions`, `#errors`, `#name`

Introspection, rarely needed at runtime.

---

## `createRequester(domain, options)`

Create a client-side requester.

| Option | Type | Description |
|---|---|---|
| `endpoint` | `string` | URL the transport sends to. |
| `transport` | `(req: Request) => Promise<Response>` | Defaults to `fetch`. |
| `middleware` | `RequesterMiddleware[]` | Logging, retry, auth, tracing. |

Returns an object with one typed method per action.

---

## Server helpers

### `handleAction(req, { domain, resolvers, ctx })`

Low-level handler. Parses a `Request`, runs the right resolver, serializes the response.

### `createRouter(routes)`

Dispatch multiple domains from a single entry point.

```ts
createRouter({
  "/api/billing": { domain: Billing, resolvers: billingResolvers },
  "/api/auth":    { domain: Auth,    resolvers: authResolvers },
})
```

---

## Middleware

### `ResolverMiddleware<Ctx>`

```ts
type ResolverMiddleware<Ctx> = (
  args: unknown,
  ctx: Ctx,
  next: (args: unknown, ctx: Ctx) => Promise<unknown>,
) => Promise<unknown>
```

### `RequesterMiddleware`

```ts
type RequesterMiddleware = (
  req: Request & { action: string; input: unknown },
  next: (req: Request) => Promise<Response>,
) => Promise<Response>
```

---

## Type helpers

```ts
import type {
  ActionInput,
  ActionOutput,
  ActionError,
  ResolverFor,
  RequesterFor,
} from "@nice-code/action"
```

- `ActionInput<Domain, "name">`
- `ActionOutput<Domain, "name">`
- `ActionError<Domain>` — union of all error types the domain can throw, plus transport errors
- `ResolverFor<Domain, "name">`
- `RequesterFor<Domain>`

---

## `ActionError`

Transport-level errors that every requester can throw:

| Variant | When |
|---|---|
| `InternalError` | Resolver threw something not in the domain's error list. |
| `Timeout`       | Request exceeded the requester's timeout. |
| `Transport`     | Network-level failure (DNS, abort, connection reset). |
| `Protocol`      | Response didn't match the nice-action wire format. |
