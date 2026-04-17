---
title: Error Integration
description: Declare, throw, and handle typed errors from actions.
---

`@nice-code/action` is built on `@nice-code/error`. Actions declare the errors they can throw, and callers get fully typed error handling.

## Declaring errors with `.throws()`

```ts
const user_domain = createActionDomain({
  domain: "user_domain",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) })
      .throws(err_user, ["not_found", "forbidden"] as const)
      .throws(err_validation),

    deleteUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .throws(err_user),
  },
});
```

The IDs listed in `.throws()` flow into the TypeScript type of `executeSafe`'s `result.error`. Always use `as const` when passing a specific ID list so TypeScript can narrow them.

## Throwing errors from handlers

```ts
user_domain.setActionRequester().forActionId(user_domain, "getUser", async ({ userId }) => {
  const user = await db.findUser(userId);
  if (!user) throw err_user.fromId("not_found");
  if (!canAccess(userId)) throw err_user.fromId("forbidden");
  return user;
});
```

Throw any `NiceError` or plain `Error` — `executeSafe` catches all of them.

## Handling errors from `executeSafe`

```ts
const result = await user_domain.action("getUser").executeSafe({ userId: "u1" });

if (!result.ok) {
  // result.error is typed as the union from .throws() + err_cast_not_nice
  result.error.handleWith([
    forIds(err_user, ["not_found"], () => res.status(404).json({ error: "Not found" })),
    forIds(err_user, ["forbidden"], () => res.status(403).json({ error: "Forbidden" })),
    forDomain(err_user, (h) => res.status(h.httpStatusCode).json({ error: h.message })),
  ]);
}
```

## `TInferActionError<SCH>`

Extract the full error union type from an action schema for use in type annotations:

```ts
import type { TInferActionError } from "@nice-code/action";

type GetUserError = TInferActionError<typeof user_domain._actions["getUser"]>;
```

## Framework errors

`@nice-code/action` uses `err_nice_action` for its own internal errors. These are returned as `NiceError` instances and can be caught with `executeSafe` or inspected with `castNiceError`.

| ID | When |
|---|---|
| `action_id_not_in_domain` | `domain.action("unknown")` — ID not in schema |
| `domain_no_handler` | `execute` called with no handler or resolver registered |
| `action_environment_not_found` | `execute(input, envId)` — named `envId` not registered |
| `environment_already_registered` | `setActionRequester` or `registerResponder` called twice with same `envId` |
| `action_input_validation_failed` | Input fails schema validation |
| `hydration_domain_mismatch` | Wire payload domain doesn't match the hydrating domain |
| `hydration_action_id_not_found` | Wire payload action ID not in domain |
| `resolver_action_not_registered` | No resolver function registered for the action ID |

## Input validation errors

Input validation happens automatically on dispatch. If validation fails, `execute` throws and `executeSafe` returns `{ ok: false, error }` with an `action_input_validation_failed` NiceError:

```ts
const result = await user_domain.action("getUser").executeSafe({ userId: 123 as any });

if (!result.ok) {
  // result.error may be action_input_validation_failed
  if (err_nice_action.isExact(result.error) && result.error.hasId("action_input_validation_failed")) {
    // validation failure
  }
}
```
