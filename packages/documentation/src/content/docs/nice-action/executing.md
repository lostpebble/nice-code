---
title: Executing Actions
description: Execute actions with execute() and executeSafe(), prime them for later, and observe dispatches.
---

Once a handler or resolver is registered, you execute actions through the domain.

## `execute(input, envId?)`

Executes and returns the raw output. Throws on error.

```ts
const user = await user_domain.action("getUser").execute({ userId: "u1" });
//    ^? { id: string; name: string }
```

Passing an `envId` routes to a specific named resolver environment (see [Resolvers](/nice-action/resolvers)).

## `executeSafe(input, envId?)`

Wraps execution in a try/catch. Returns a discriminated union:

```ts
const result = await user_domain.action("getUser").executeSafe({ userId: "u1" });

if (result.ok) {
  result.output; // { id: string; name: string }
} else {
  result.error;  // NiceError — typed from .throws() declarations on the schema
}
```

The `result.error` type is the union of all declared `.throws()` error domains plus `err_cast_not_nice` (the fallback for non-NiceError throws).

## Integrating with `handleWith`

The error from `executeSafe` is a `NiceError`, so all core routing primitives apply:

```ts
import { forDomain, forIds } from "@nice-error/core";

const result = await user_domain.action("getUser").executeSafe({ userId: "u1" });

if (!result.ok) {
  result.error.handleWith([
    forIds(err_user, ["not_found"], () => res.status(404).json({ error: "Not found" })),
    forDomain(err_user, (h) => res.status(h.httpStatusCode).json({ error: h.message })),
  ]);
}
```

## Primed actions

`prime(input)` attaches input to an action without executing it — useful when you want to serialize and send the action over a wire.

```ts
const primed = user_domain.action("getUser").prime({ userId: "u1" });

// Execute later
const user = await primed.execute();

// Or executeSafe
const result = await primed.executeSafe();

// Serialize for transport
const wire = primed.toJsonObject();
const json = primed.toJsonString();
```

## Action listeners

Observe every dispatch without modifying behavior:

```ts
user_domain.addActionListener((primed) => {
  console.log(`[${primed.coreAction.domain}] ${primed.coreAction.id}`);
});
```

Listeners fire after every successful dispatch, including through resolvers and named environments.

## `matchAction(act, id)` — narrowing inside a handler

Inside a domain-wide handler, `matchAction` narrows the primed action to a specific ID:

```ts
user_domain.setActionRequester().forDomain(user_domain, (act) => {
  const getUser = user_domain.matchAction(act, "getUser");
  if (getUser) {
    // getUser.input is typed to getUser's input schema
    return db.findUser(getUser.input.userId);
  }

  const deleteUser = user_domain.matchAction(act, "deleteUser");
  if (deleteUser) {
    return db.deleteUser(deleteUser.input.userId);
  }
});
```

`matchAction` returns the narrowed primed action or `null` if the IDs don't match.
