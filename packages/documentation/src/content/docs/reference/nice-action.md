---
title: "@nice-code/action — API reference"
description: The full public surface of @nice-code/action.
tableOfContents:
  maxHeadingLevel: 4
---

## `createActionRootDomain(definition)`

Create the root of a domain tree. Every application has one root.

| Param | Type | Description |
|---|---|---|
| `definition.domain` | `string` | Root domain name — e.g. `"app"`. |

Returns a `NiceActionRootDomain`.

---

## `action()`

Start building an action schema. Chain methods to declare its signature.

### `.input(options, serialize?, deserialize?)`

| Option | Type | Description |
|---|---|---|
| `schema` | `StandardSchemaV1` | Validator (Valibot, Zod, etc.) for the raw input type. |
| `serialize` | `(input: Input) => SerdeInput` | Optional. Serialize for wire transport. |
| `deserialize` | `(serde: SerdeInput) => Input` | Required when `serialize` is provided. |

### `.output(options, serialize?, deserialize?)`

Same structure as `.input()`. Omit entirely for `void`-output actions.

### `.throws(errDomain, ids?)`

Declare possible errors. Chain multiple times for multiple domains.

| Param | Type | Description |
|---|---|---|
| `errDomain` | `NiceErrorDomain` | Error domain this action may throw. |
| `ids` | `readonly string[]?` | Specific IDs. Omit to allow all IDs in that domain. |

---

## `NiceActionRootDomain`

### `NiceActionRootDomain#createChildDomain(opts)`

Create a child domain. `opts.domain` is the domain name, `opts.actions` is a map of action IDs to `NiceActionSchema` instances.

### `NiceActionRootDomain#setRuntimeEnvironment(env)`

Attach an `ActionRuntimeEnvironment` to this root. Throws `environment_already_registered` if called twice.

---

## `NiceActionDomain<ACT_DOM>`

Child domains returned by `createChildDomain`. Has all the same action methods.

### `NiceActionDomain#action(id)`

Get a `NiceAction` for the given action ID. Throws `action_id_not_in_domain` if the ID isn't in the schema.

### `NiceActionDomain#primeAction(id, input)`

Shorthand for `action(id).prime(input)`.

### `NiceActionDomain#createChildDomain(opts)`

Create a nested domain. The child's `allDomains` includes the parent's ancestry chain.

### `NiceActionDomain#addActionListener(listener)`

Register an observer for all actions dispatched through this domain. Returns an unsubscribe function.

```ts
const unsubscribe = domain.addActionListener({
  execution: (primed, { tag, runtime }) => { /* fires before handler */ },
  response: (response, { tag, runtime }) => { /* fires after handler */ },
})
```

### `NiceActionDomain#hydratePrimed(wire)`

Reconstruct a `NiceActionPrimed` from its serialized wire format. Validates input against the schema.

### `NiceActionDomain#hydrateResponse(wire)`

Reconstruct a `NiceActionResponse` from its serialized wire format.

---

## `NiceAction<DOM, ID>`

### `NiceAction#execute(input, meta?)`

Execute and return the typed output. Throws on failure.

### `NiceAction#executeSafe(input, meta?)`

Execute and return `TNiceActionResult`. Never throws.

### `NiceAction#executeToResponse(input, meta?)`

Execute and return a `NiceActionResponse` (carries action identity + result).

### `NiceAction#prime(input)`

Create a `NiceActionPrimed` with the given input. Validates input immediately.

### `NiceAction#is(action)`

Type guard: `true` if `action` is a `NiceActionPrimed` for this action ID and domain.

---

## `NiceActionPrimed<DOM, ID>`

### `NiceActionPrimed#execute(meta?)`

Execute the stored action. Throws on failure.

### `NiceActionPrimed#executeSafe(meta?)`

Execute and return `TNiceActionResult`.

### `NiceActionPrimed#executeToResponse(meta?)`

Execute and return a `NiceActionResponse`.

### `NiceActionPrimed#setResponse(output)`

Wrap a successful output in a `NiceActionResponse`. Used inside handler `execution` functions.

### `NiceActionPrimed#errorResponse(error)`

Wrap a typed error in a `NiceActionResponse`.

### `NiceActionPrimed#toJsonObject()`

Serialize to `INiceActionPrimed_JsonObject`.

---

## `NiceActionResponse<DOM, ID>`

### `NiceActionResponse#result`

`TNiceActionResult<OUTPUT, ERROR>` — `{ ok: true; output }` or `{ ok: false; error }`.

### `NiceActionResponse#primed`

The `NiceActionPrimed` that was executed. Carries `cuid`, `input`, `timePrimed`, etc.

### `NiceActionResponse#timeResponded`

Unix ms when execution completed.

### `NiceActionResponse#toJsonObject()`

Serialize to `TNiceActionResponse_JsonObject`.

### `NiceActionResponse#toHttpResponse(useErrorStatus?)`

Return a `Response` with JSON body and appropriate HTTP status code.

---

## `ActionRuntimeEnvironment`

Created via `createActionRuntime({ envId })`.

### `ActionRuntimeEnvironment#addHandlers(handlers)`

Register one or more `IActionHandler` instances. Returns `this`.

### `ActionRuntimeEnvironment#setDefaultHandler(handler, tag?)`

Set a fallback handler used when no specific handler matches.

---

## `createActionRuntime(options)`

Create an `ActionRuntimeEnvironment`.

| Param | Type | Description |
|---|---|---|
| `options.envId` | `string` | Identifies this runtime (e.g. `"server"`, `"browser"`). |

---

## `ActionHandler`

Local / same-process handler. Implements `IActionHandler`.

```ts
new ActionHandler(options?)
```

| Option | Type | Description |
|---|---|---|
| `tag` | `string?` | Named tag for this handler. Default: `"_"` (unnamed). |

### `ActionHandler#forAction(domain, id, handlers)`

Register execution and optional response handlers for one action.

### `ActionHandler#forActionIds(domain, ids, handlers)`

Register handlers for a named subset of actions.

### `ActionHandler#forDomain(domain, handlers)`

Register handlers for all actions in a domain.

### `ActionHandler#forDomainActionCases(domain, cases)`

Register handlers via a case map — one entry per action ID.

### `ActionHandler#dispatchAction(primed)`

Dispatch a `NiceActionPrimed` directly (bypasses environment routing). Returns `Promise<NiceActionResponse>`.

### `ActionHandler#handleWire(body)`

Parse an unknown request body and dispatch if matched.

```ts
const result = await handler.handleWire(req.body)
// result: { handled: boolean; response?: NiceActionResponse }
```

---

## `ActionConnect`

Remote handler. Forwards actions over HTTP or WebSocket. Implements `IActionHandler`.

```ts
new ActionConnect(connections, options?)
```

| Param | Type | Description |
|---|---|---|
| `connections` | `ConnectionConfig[]` | One or more transport configurations. |
| `options.requestTimeout` | `number` | Ms before a pending request is rejected. |

### `ActionConnect#routeDomain(domain, route?)`

Route all actions in `domain` through this connection.

### `ActionConnect#routeAction(domain, id, route?)`

Route one specific action.

### `ActionConnect#routeActionIds(domain, ids, route?)`

Route a named subset of actions.

### `ActionConnect#disconnect()`

Close all connections. Pending requests are rejected.

---

## `ConnectionConfig`

Manages one logical connection with one or more transport layers.

```ts
new ConnectionConfig({ transports })
```

| Transport type | Config |
|---|---|
| `"http"` | `{ type: "http"; url: string }` |
| `"ws"` | `{ type: "ws"; url: string }` |

---

## `matchAction(action)`

Type-safe pattern matching for actions. Chain `.with(...)` clauses and resolve with `.run()` or `.runAsync()`.

```ts
await matchAction(incomingAction)
  .with({ domain: userDomain, id: "getUser", handler: async (action) => { ... } })
  .with({ domain: userDomain, handler: async (action) => { ... } })  // all user actions
  .otherwise(async (action) => { ... })
  .runAsync()
```

---

## Type helpers

| Type | Description |
|---|---|
| `TInferActionError<SCH>` | Union of all error types declared via `.throws()` on a schema. |
| `TInferInputFromSchema<SCH>` | Infer `Input` and `SerdeInput` from an action schema. |
| `TInferOutputFromSchema<SCH>` | Infer `Output` and `SerdeOutput` from an action schema. |
| `TNiceActionResult<OUT, ERR>` | `{ ok: true; output: OUT } \| { ok: false; error: ERR }` |
| `INiceAction_JsonObject` | Serialized empty action wire format. |
| `INiceActionPrimed_JsonObject` | Serialized primed action wire format. |
| `TNiceActionResponse_JsonObject` | Serialized response wire format. |

---

## `err_nice_action` — framework error domain

Internal errors thrown by the action system:

| ID | When |
|---|---|
| `action_id_not_in_domain` | `domain.action("id")` called with unknown ID. |
| `domain_no_handler` | `execute()` called but no handler registered. |
| `environment_already_registered` | `setRuntimeEnvironment()` called twice. |
| `domain_already_exists_in_hierarchy` | Duplicate domain name in the ancestry chain. |
| `hydration_domain_mismatch` | Wire domain doesn't match the domain being hydrated into. |
| `hydration_action_state_mismatch` | Wire `type` field doesn't match expected state. |
| `hydration_action_id_not_found` | Wire action ID isn't in the domain's schema. |
| `no_action_execution_handler` | Handler matched but has no `execution` function. |
| `action_tag_handler_not_found` | `meta.tag` specified but no handler with that tag exists. |
| `action_input_validation_failed` | Input failed schema validation (HTTP 400). |
| `action_input_validation_promise` | Input schema validation returned a Promise (unsupported). |
| `action_output_validation_failed` | Output failed schema validation (HTTP 500). |
| `action_output_validation_promise` | Output schema validation returned a Promise (unsupported). |
| `wire_action_not_primed_or_response` | `handleWire` received a wire object with wrong `type`. |
| `wire_not_action_data` | Wire object is missing the `domain` property. |
