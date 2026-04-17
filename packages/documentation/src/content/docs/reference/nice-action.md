---
title: "@nice-code/action — API Reference"
description: Complete API reference for @nice-code/action.
---

## Defining domains

### `createActionDomain(opts)`

Creates a root action domain.

```ts
createActionDomain({
  domain: string,              // unique domain identifier
  actions: TNiceActionDomainSchema,  // map of id → action() entries
})
```

Returns `NiceActionDomain`.

### `action()`

Starts an action schema builder. Chain `.input()`, `.output()`, and `.throws()`.

#### `.input(opts)`

```ts
.input({
  schema: StandardSchemaV1,      // valibot, zod, etc.
  serialization?: {
    serialize:   (input) => SerializedInput,
    deserialize: (s: SerializedInput) => Input,
  },
})
```

#### `.output(opts)`

Same structure as `.input()`.

#### `.throws(errDef, ids?)`

```ts
.throws(err_user)                               // all IDs
.throws(err_user, ["not_found"] as const)       // specific IDs
```

---

## `NiceActionDomain`

### `.action(id)`

Returns a `NiceAction` for the given ID. TypeScript errors on unknown IDs.

### `.primeAction(id, input)`

Shorthand for `action(id).prime(input)`.

### `.setActionRequester(opts?)`

Registers a dispatch handler. Returns a `NiceActionRequester`. Throws if called twice for the same `envId`.

```ts
domain.setActionRequester()            // default handler
domain.setActionRequester({ envId })   // named environment
```

### `.registerResponder(resolver, opts?)`

Registers a `NiceActionDomainResponder`. The resolver is used when no requester fires.

```ts
domain.registerResponder(resolver)
domain.registerResponder(resolver, { envId })
```

### `.addActionListener(fn)`

Registers an observer called after every dispatch.

```ts
domain.addActionListener((primed) => { ... })
```

### `.hydrateAction(wire)`

Deserializes a primed action JSON object.

### `.hydrateResponse(wire)`

Deserializes a response JSON object into a `NiceActionResponse`.

### `.createChildDomain(opts)`

Creates a child domain inheriting this domain's ancestry.

### `.matchAction(act, id)`

Narrows a primed action to a specific ID. Returns the narrowed action or `null`.

### `.isExactActionDomain(action)`

Type guard — returns `true` if the primed action belongs to this exact domain.

---

## `NiceAction`

### `.execute(input, envId?)`

Executes and returns the raw output. Throws on error.

### `.executeSafe(input, envId?)`

Returns `NiceActionResult<Output, Error>` — a discriminated union.

### `.prime(input)`

Returns a `NiceActionPrimed` with input attached.

---

## `NiceActionPrimed`

### Properties

| Property | Type | Description |
|---|---|---|
| `coreAction` | `NiceAction` | The action definition |
| `input` | `Input` | The typed input |
| `domain` | `string` | Domain identifier |
| `allDomains` | `string[]` | Ancestry chain |
| `id` | `string` | Action ID |

### Methods

#### `.execute(envId?)`

Execute the stored action with stored input.

#### `.executeSafe(envId?)`

Execute returning `NiceActionResult`.

#### `.toJsonObject()`

Serialize to wire format (plain object).

#### `.toJsonString()`

Serialize to JSON string.

---

## `NiceActionResult<OUT, ERR>`

Discriminated union returned by `executeSafe`:

```ts
{ ok: true;  output: OUT } |
{ ok: false; error: ERR  }
```

`ERR` is the union of all `.throws()` declarations plus `err_cast_not_nice`.

---

## `NiceActionResponse`

### Properties

| Property | Type | Description |
|---|---|---|
| `primed` | `NiceActionPrimed` | The executed action |
| `result` | `NiceActionResult` | The result |

### Methods

#### `.toJsonObject()`

Serialize to wire format.

#### `.toJsonString()`

Serialize to JSON string.

---

## Requesters

### `NiceActionRequester`

Returned by `domain.setActionRequester()`.

#### `.forDomain(domain, handler)`

Handles all actions in the domain.

#### `.forActionId(domain, id, handler)`

Handles a single action ID. Handler receives the primed action with fully typed input.

#### `.forActionIds(domain, ids, handler)`

Handles multiple action IDs.

---

## Resolvers

### `createDomainResolver(domain)`

Creates a `NiceActionDomainResponder` for the given domain.

### `NiceActionDomainResponder`

#### `.resolveAction(id, fn)`

Registers a resolver function for an action ID. Returns the same responder for chaining.

```ts
createDomainResolver(domain)
  .resolveAction("getUser", ({ userId }) => db.findUser(userId))
  .resolveAction("deleteUser", ({ userId }) => db.deleteUser(userId))
```

---

## Responder environments

### `createResponderEnvironment(resolvers)`

Creates a `NiceActionResponderEnvironment` from an array of domain resolvers.

### `NiceActionResponderEnvironment`

#### `.dispatch(wire)`

Deserializes a primed action JSON, routes to the correct domain resolver, and returns a serialized response.

---

## Type utilities

### `TInferActionError<SCH>`

Extracts the full error union from an action schema (the type of `result.error` from `executeSafe`).

### `TInferInputFromSchema<SCH>`

Extracts `{ Input, SerdeInput }` from an action schema.

### `TInferOutputFromSchema<SCH>`

Extracts `{ Output, SerdeOutput }` from an action schema.

---

## Wire format utilities

### `isPrimedActionJsonObject(value)`

Type guard for primed action wire objects.

### `isActionResponseJsonObject(value)`

Type guard for response wire objects.

---

## Framework errors

All exported from `err_nice_action` (`EErrId_NiceAction` enum):

| ID | Description |
|---|---|
| `action_id_not_in_domain` | Action ID not in domain schema |
| `domain_no_handler` | No handler or resolver registered |
| `action_environment_not_found` | Named `envId` not registered |
| `environment_already_registered` | Duplicate `envId` registration |
| `action_input_validation_failed` | Input failed schema validation |
| `hydration_domain_mismatch` | Wire domain doesn't match hydrating domain |
| `hydration_action_id_not_found` | Wire action ID not in domain |
| `resolver_action_not_registered` | No resolver function for action ID |
