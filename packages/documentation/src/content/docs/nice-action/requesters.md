---
title: Requesters
description: Register dispatch handlers with setActionRequester.
---

A **requester** is a handler registry that intercepts action dispatches and routes them to the right function. Use it when the execution logic lives elsewhere (a different module, service, or process) and the domain needs to delegate.

## Registering a requester

```ts
const requester = user_domain.setActionRequester();
```

`setActionRequester()` returns a `NiceActionRequester` you can chain registration calls onto. Only one requester can be registered per domain (plus named environments).

## `forDomain(domain, handler)`

Handles all actions in a domain. Use `matchAction` to narrow to specific IDs:

```ts
user_domain.setActionRequester().forDomain(user_domain, (act) => {
  const getUser = user_domain.matchAction(act, "getUser");
  if (getUser) {
    return db.findUser(getUser.input.userId);
  }

  const deleteUser = user_domain.matchAction(act, "deleteUser");
  if (deleteUser) {
    return db.deleteUser(deleteUser.input.userId);
  }
});
```

The handler receives a `NiceActionPrimed` narrowed to the domain's schema. It can be sync or async.

## `forActionId(domain, id, handler)`

Register a handler for a single action ID. The handler receives the primed action with the input fully typed to that action's schema:

```ts
user_domain.setActionRequester()
  .forActionId(user_domain, "getUser", (act) => {
    // act.input: { userId: string }
    return db.findUser(act.input.userId);
  })
  .forActionId(user_domain, "deleteUser", (act) => {
    return db.deleteUser(act.input.userId);
  });
```

## `forActionIds(domain, ids, handler)`

Handle multiple IDs with one handler:

```ts
user_domain.setActionRequester()
  .forActionIds(user_domain, ["getUser", "deleteUser"], (act) => {
    // act is narrowed to the union of those two action inputs
  });
```

## Named environments

You can register additional requesters under named `envId` values, then target them explicitly when executing:

```ts
user_domain.setActionRequester({ envId: "staging" })
  .forDomain(user_domain, (act) => {
    // routes to staging backend
  });

// Execute against the named environment
await user_domain.action("getUser").execute({ userId: "u1" }, "staging");
```

Multiple named environments can coexist. The default (no `envId`) and named environments are independent.

## Error behavior

- **No handler registered**: `execute` throws `domain_no_handler`
- **Duplicate registration**: calling `setActionRequester()` twice throws `environment_already_registered`
- **Unknown `envId`**: throws `action_environment_not_found`

All these are `NiceError` instances from `err_nice_action`.
