---
title: Action Domains
description: Define typed action domains with input/output schemas and error declarations.
---

An action domain is a named collection of actions. Each action has a typed input schema, an optional typed output schema, and optional error declarations that tell callers what errors the action can throw.

## Creating a domain

```ts
import { createActionDomain, action } from "@nice-error/nice-action";
import * as v from "valibot";

const user_domain = createActionDomain({
  domain: "user_domain",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) })
      .throws(err_user, ["not_found", "forbidden"] as const),

    deleteUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .throws(err_user),

    listUsers: action()
      .input({ schema: v.object({ page: v.number() }) })
      .output({ schema: v.object({ users: v.array(v.object({ id: v.string() })) }) }),
  },
});
```

## The `action()` builder

`action()` starts an action schema definition. Chain `.input()`, `.output()`, and `.throws()` to describe it:

### `.input(opts)`

Declares the action's input shape. Uses any [Standard Schema](https://github.com/standard-schema/standard-schema)-compatible validator (valibot, zod, etc.):

```ts
action().input({ schema: v.object({ name: v.string(), age: v.number() }) })
```

For non-JSON-native types (e.g. `Date`), attach serialization hooks:

```ts
action().input({
  schema: v.object({ at: v.date() }),
  serialization: {
    serialize:   ({ at }) => ({ iso: at.toISOString() }),
    deserialize: (s: { iso: string }) => ({ at: new Date(s.iso) }),
  },
})
```

See [Wire Format](/nice-action/wire-format) for more on serialization.

### `.output(opts)`

Declares the return type. Same API as `.input()`. The output is validated at runtime when a resolver/handler returns a value:

```ts
action()
  .input({ schema: v.object({ id: v.string() }) })
  .output({ schema: v.object({ name: v.string(), email: v.string() }) })
```

### `.throws(errDef, ids?)`

Declare the error types this action can throw. These flow into the TypeScript type of `executeSafe`'s `result.error` union.

```ts
// All IDs in err_user can be thrown
.throws(err_user)

// Only specific IDs
.throws(err_user, ["not_found", "forbidden"] as const)

// Multiple error domains
.throws(err_user, ["not_found"])
.throws(err_validation)
```

## Child domains

Domains can be nested. Child domains inherit their parent's ancestry:

```ts
const root = createActionDomain({ domain: "root", actions: { ... } });

const child = root.createChildDomain({
  domain: "users",
  actions: {
    create: action().input({ schema: v.object({ name: v.string() }) }),
  },
});

// child.allDomains = ["root", "users"]
```

## Getting a NiceAction

```ts
const getUser = user_domain.action("getUser");
// getUser: NiceAction<...> — typed to getUser's schema
```

TypeScript will error if the ID doesn't exist in the domain.
