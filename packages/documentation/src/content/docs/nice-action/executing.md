---
title: Executing actions
description: How to run actions — execute(), executeSafe(), prime(), and pattern matching.
---

Once a domain has a runtime environment registered (via a handler or remote transport), actions can be executed from anywhere that has access to the domain object.

## `execute` — throw on failure

```ts
// Returns the typed output; throws if the action fails
const user = await userDomain.action("getUser").execute({ userId: "u1" })
```

## `executeSafe` — discriminated union result

```ts
const result = await userDomain.action("getUser").executeSafe({ userId: "u1" })

if (result.ok) {
  console.log(result.output.name)  // typed from the output schema
} else {
  result.error.handleWithSync([
    forId(err_user, "not_found", (h) => {
      console.error("User not found:", h.getContext("not_found").userId)
    }),
    forDomain(err_auth, (h) => console.error("Auth error:", h.message)),
  ])
}
```

`TNiceActionResult` is `{ ok: true; output: OUT } | { ok: false; error: ERR }`.

## `executeToResponse` — full response object

```ts
const response = await userDomain.action("getUser").executeToResponse({ userId: "u1" })
// response: NiceActionResponse — carries action identity + result
// response.result: { ok: true, output } | { ok: false, error }
// response.primed.cuid — correlation ID (same across all three action states)
```

Useful when you need the action metadata alongside the result, e.g. for logging or wire serialization.

## `prime` — attach input without executing

```ts
const primed = userDomain.action("getUser").prime({ userId: "u1" })
// primed.input = { userId: "u1" }  (validated against input schema)
// primed.cuid  = "abc123..."       (unique correlation ID)

// Execute later
const user = await primed.execute()
const result = await primed.executeSafe()
```

`prime()` validates input immediately — it throws `action_input_validation_failed` if the input doesn't match the schema. This is also the step that triggers serialization; `primed.toJsonObject()` is ready to send over the wire.

## Named execution targets (tags)

When multiple handlers share a domain and are registered under different tags, target them at call time:

```ts
// Target a specific named handler
const result = await userDomain.action("getUser").execute({ userId: "u1" }, { tag: "admin" })
```

See [Handlers](/nice-action/requesters/) for how tags are registered.

## Pattern matching with `matchAction`

`matchAction` type-narrows an unknown action to a specific definition — useful inside a catch-all handler:

```ts
import { matchAction } from "@nice-code/action"

await matchAction(incomingAction)
  .with({
    domain: userDomain,
    id: "getUser",
    handler: async (action) => {
      // action narrowed to NiceActionPrimed<UserDomain, "getUser">
      await notifyAnalytics(action.input.userId)
    },
  })
  .with({
    domain: userDomain,
    id: "deleteUser",
    handler: async (action) => {
      await notifyAuditLog(action.input.userId)
    },
  })
  .otherwise(async (action) => {
    console.warn(`Unhandled action: ${action.domain}::${action.id}`)
  })
  .runAsync()  // or .run() for sync handlers
```

## Action listeners (observability)

Register an observer on any domain — fires for every action dispatched through it:

```ts
const unsubscribe = userDomain.addActionListener({
  execution: (primed, { tag, runtime }) => {
    logger.info(`→ ${primed.domain}::${primed.id}`, { input: primed.input, tag })
  },
  response: (response, { tag, runtime }) => {
    if (response.result.ok) {
      metrics.increment("action.success", { id: response.id })
    } else {
      metrics.increment("action.error", { id: response.id, error: response.result.error.id })
    }
  },
})

// Detach when done
unsubscribe()
```

Listeners are passive — they can't modify the execution flow. For interception, use a handler's `response` function (see [Handlers](/nice-action/requesters/)).

## Minimum working example

```ts
import { createActionRootDomain, action, ActionHandler, createActionRuntime } from "@nice-code/action"
import * as v from "valibot"

const root = createActionRootDomain({ domain: "app" })

const userDomain = root.createChildDomain({
  domain: "user",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) }),
  },
})

root.setRuntimeEnvironment(
  createActionRuntime({ envId: "server" }).addHandlers([
    new ActionHandler().forAction(userDomain, "getUser", {
      execution: async (primed) => {
        const user = await db.findUser(primed.input.userId)
        return primed.setResponse(user)
      },
    }),
  ])
)

const user = await userDomain.action("getUser").execute({ userId: "u1" })
```

For dispatching actions across a network boundary, see [Remote Transport](/nice-action/resolvers/).
