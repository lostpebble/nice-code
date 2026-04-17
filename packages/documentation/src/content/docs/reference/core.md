---
title: "@nice-code/error — API Reference"
description: Complete API reference for @nice-code/error.
---

## Defining domains

### `defineNiceError(opts)`

Creates a root error domain.

```ts
defineNiceError({
  domain: string,            // unique domain identifier
  schema: TNiceErrorSchema,  // map of id → err() entries
  packAs?: () => EErrorPackType,  // optional default pack strategy
})
```

Returns `NiceErrorDefined`.

### `err<C, D>(meta?)`

Defines a single schema entry. Pass the context type as a generic.

```ts
err()                          // no context
err<{ field: string }>({       // optional context
  message: "Invalid field",
  httpStatusCode: 422,
})
err<{ field: string }>({       // required context
  message: ({ field }) => `Invalid: ${field}`,
  httpStatusCode: 422,
  context: { required: true },
})
```

`message` and `httpStatusCode` accept static values or functions receiving the context.

---

## `NiceErrorDefined`

The factory returned by `defineNiceError`.

### `.fromId(id, ctx?)`

Creates a single-ID error. Context is required when `context.required: true` in the schema.

### `.fromContext(map)`

Creates a multi-ID error from a `{ id: context }` map.

### `.createChildDomain(opts)`

Creates a child domain inheriting this domain's ancestry.

### `.hydrate(error)`

Promotes a cast `NiceError` to `NiceErrorHydrated` for this domain.

### `.isExact(error)`

Type guard — exact domain match only.

### `.isThisOrChild(error)`

Type guard — matches this domain and all descendants.

### `.isParentOf(target)`

Returns `true` if this domain is an ancestor of the given domain or error.

### `.packAs(type)`

Sets the default pack strategy for this domain and its children.

---

## `NiceError`

The base error class. Extends `Error`.

### Properties

| Property | Type | Description |
|---|---|---|
| `domain` | `string` | Domain identifier |
| `allDomains` | `string[]` | Full ancestry chain |
| `ids` | `string[]` | Active error IDs |
| `hasMultiple` | `boolean` | More than one active ID |
| `message` | `string` | Computed error message |
| `httpStatusCode` | `number` | HTTP status code (default 500) |
| `originError` | `NiceError \| undefined` | Attached origin error |
| `wasntNice` | `boolean` | True when wrapped from a non-NiceError |

### Methods

#### `.hasId(id)`

Type guard — narrows to a single active ID.

#### `.hasOneOfIds(ids)`

Type guard — narrows to a subset of IDs.

#### `.getContext(id)`

Returns the typed context for an active ID.

#### `.getIds()`

Returns all active IDs as an array.

#### `.getErrorDataForId(id)`

Returns the raw internal entry for an ID.

#### `.addId(id, ctx?)`

Returns a new error with an additional ID. The original is unchanged.

#### `.addContext(map)`

Returns a new error with additional IDs from a `{ id: context }` map.

#### `.matches(other)`

Returns `true` if both errors have the same domain and the same set of IDs (context values are ignored).

#### `.withOriginError(error)`

Returns a new error with the given error attached as `originError`.

#### `.toJsonObject()`

Serializes to a plain JSON-safe object.

#### `.pack(type?)`

Packs the serialized error into `message` (default) or `cause` for transport across opaque boundaries.

#### `.unpack()`

Restores the error from its packed state. Rarely needed — `castNiceError` unpacks automatically.

#### `.handleWith(cases)`

Routes to the first matching case. Returns the handler's return value or `false` if no case matched.

#### `.handleWithAsync(cases)`

Async version of `handleWith`.

---

## Routing primitives

### `forDomain(domain, handler)`

Creates a case that fires for any error from that exact domain.

### `forIds(domain, ids, handler)`

Creates a case that fires only when the error is from that domain and at least one of the IDs is active.

---

## Pattern matching

### `matchFirst(error, handlers)`

Matches the first active ID against a `{ id: handler }` map. Returns the result of the matched handler.

```ts
matchFirst(error, {
  not_found: ({ userId }) => `User ${userId} not found`,
  forbidden: ()           => "Access denied",
  _:         ()           => "Unknown error",
})
```

---

## Casting and utilities

### `castNiceError(value)`

Accepts any value and returns a `NiceError`. Handles:
- `NiceError` instances (returned as-is)
- Serialized NiceError JSON objects (reconstructed)
- Packed errors (unpacked automatically)
- Native `Error` instances (wrapped in `err_cast_not_nice`)
- Strings, `null`, `undefined`, other primitives (wrapped)

### `castAndHydrate(value, domain)`

`castNiceError` + `domain.hydrate()` in one call.

### `isNiceErrorObject(value)`

Type guard for serialized NiceError JSON.

### `isRegularErrorJsonObject(value)`

Type guard for serialized native Error JSON.

---

## Error packing

### `EErrorPackType`

```ts
enum EErrorPackType {
  msg_pack   = "msg_pack",
  cause_pack = "cause_pack",
}
```

---

## Type utilities

### `InferNiceError<T>`

Infers the `NiceError` type from a `NiceErrorDefined`.

### `InferNiceErrorHydrated<T>`

Infers the `NiceErrorHydrated` type from a `NiceErrorDefined`.
