---
title: Introduction
description: What nice-error is and why you might want it.
---

`nice-error` is two TypeScript packages that treat errors and structured actions as first-class, typed, serializable values.

## The problem

Plain JavaScript errors are stringly typed — you throw an `Error` with a message and hope the catcher figures out what happened. This falls apart at boundaries:

- No autocomplete on error types or their context
- `instanceof` breaks across serialization
- You can't safely carry an error across an HTTP response or a Durable Object boundary and reconstruct it on the other side with full types
- Typed request/response patterns require a lot of boilerplate

## What nice-error provides

### `@nice-error/core`

An error domain system where you declare your errors up front as a typed schema:

```ts
import { defineNiceError, err } from "@nice-error/core";

const err_billing = defineNiceError({
  domain: "err_billing",
  schema: {
    payment_failed: err<{ reason: string }>({
      message: ({ reason }) => `Payment failed: ${reason}`,
      httpStatusCode: 402,
      context: { required: true },
    }),
    card_expired: err({ message: "Card has expired", httpStatusCode: 402 }),
  },
});
```

From that schema you get:

- **Autocomplete** on error IDs everywhere (`fromId`, `hasId`, `getContext`, …)
- **Typed context** that flows from creation through narrowing to access
- **Type guards** that tell TypeScript which IDs are active on an error instance
- **Safe serialization** — `toJsonObject()` produces plain JSON, `castNiceError()` reconstructs on the other side
- **Domain hierarchy** — parent/child domains with ancestry checks
- **Pattern matching** — `handleWith`, `matchFirst`

### `@nice-error/nice-action`

A typed action framework built on top of `@nice-error/core`. Define actions with input/output schemas, declare the errors they can throw, then register handlers and execute:

```ts
import { createActionDomain, action } from "@nice-error/nice-action";
import * as v from "valibot";

const user_domain = createActionDomain({
  domain: "user_domain",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) })
      .throws(err_user, ["not_found"]),
  },
});
```

Actions serialize to JSON, travel across any transport, and reconstruct on the other side — with full input/output types intact.

## Packages

| Package | npm |
|---|---|
| `@nice-error/core` | `bun add @nice-error/core` |
| `@nice-error/nice-action` | `bun add @nice-error/nice-action` |
