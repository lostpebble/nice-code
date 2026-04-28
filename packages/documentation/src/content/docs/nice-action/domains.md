---
title: Action domains
description: Declare a set of typed actions with input, output, and error schemas.
---

An **action domain** is a namespace of named actions. Every action declares its input schema, output schema, and which errors it can throw. The domain tree starts at a root and branches into child domains for different parts of your app.

## Creating the root domain

```ts
import { createActionRootDomain } from "@nice-code/action"

const root = createActionRootDomain({ domain: "app" })
```

The root domain is the execution hub — it holds the runtime environment that routes actions to handlers.

## Creating child domains

```ts
import { action } from "@nice-code/action"
import * as v from "valibot"
import { err_user, err_auth } from "./errors"

export const userDomain = root.createChildDomain({
  domain: "user",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string(), email: v.string() }) })
      .throws(err_user, ["not_found"] as const)
      .throws(err_auth, ["unauthenticated"] as const),

    deleteUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .throws(err_user)
      .throws(err_auth),

    listUsers: action()
      .input({ schema: v.object({ limit: v.number(), cursor: v.optional(v.string()) }) })
      .output({
        schema: v.object({
          items: v.array(v.object({ id: v.string(), name: v.string() })),
          nextCursor: v.optional(v.string()),
        }),
      }),
  },
})
```

Child domains can also create their own children — ancestry is tracked in `allDomains`:

```ts
const billingDomain = root.createChildDomain({ domain: "billing", actions: { ... } })
const invoiceDomain = billingDomain.createChildDomain({ domain: "invoice", actions: { ... } })

invoiceDomain.allDomains  // ["invoice", "billing", "app"]
```

## The `action()` builder

`action()` starts an action schema. Chain methods to declare its signature.

### `.input(options, serialize?, deserialize?)`

Declares the input schema using any [Standard Schema](https://standardschema.dev)-compatible validator (Valibot, Zod, etc.):

```ts
action().input({ schema: v.object({ userId: v.string() }) })
```

For non-JSON-safe types (e.g. `Date`), provide serialization hooks as extra arguments:

```ts
action().input(
  { schema: v.object({ scheduledAt: v.date() }) },
  ({ scheduledAt }) => ({ iso: scheduledAt.toISOString() }),  // serialize for wire
  ({ iso }) => ({ scheduledAt: new Date(iso) })                // deserialize on receipt
)
```

The handler always receives the deserialized value. The wire carries the serialized form.

### `.output(options, serialize?, deserialize?)`

Declares the output schema. Optional — actions without an output schema return `void`. Same serialization hooks available as `.input()`.

### `.throws(errDomain, ids?)`

Declares which errors this action can throw. Chain multiple times for multiple domains:

```ts
action()
  .throws(err_user, ["not_found", "forbidden"] as const)  // specific IDs only
  .throws(err_auth)                                        // all IDs in err_auth
```

Omit `ids` to allow all IDs from that domain. The declared errors type the `error` field in `executeSafe()` results.

## Domain properties

```ts
userDomain.domain      // "user"
userDomain.allDomains  // ["user", "app"]
```

## Naming conventions

- **Root domain**: reflects the app name — `"app"`, `"api"`.
- **Child domain**: noun, snake_case — `"user"`, `"billing"`, `"order"`.
- **Action ID**: camelCase, verb-first — `getUser`, `deleteUser`, `listInvoices`.
- **Error domain variable**: `err_` prefix — `err_user`, `err_auth`, `err_billing`.
