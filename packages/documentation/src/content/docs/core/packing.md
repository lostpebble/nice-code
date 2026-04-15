---
title: Error Packing
description: Survive opaque runtime boundaries by packing errors into message or cause.
---

Some runtime boundaries only propagate an error's `message` string and discard everything else. Cloudflare Durable Objects are a common example — when a method throws, only `error.message` crosses the boundary; the full object is lost.

**Packing** embeds the serialized error into `message` (or `cause`) so it survives the crossing. The other side unpacks it automatically.

## Packing an error

```ts
// msg_pack — embeds JSON in error.message (default)
throw error.pack();
throw error.pack("msg_pack");

// cause_pack — embeds JSON in error.cause
throw error.pack("cause_pack");
```

Use `msg_pack` when only `error.message` passes the boundary.  
Use `cause_pack` when `error.cause` is preserved and you want `message` to remain human-readable.

## Unpacking on the other side

`castNiceError` automatically detects and unpacks both pack formats:

```ts
import { castNiceError } from "@nice-error/core";

const error = castNiceError(caught); // unpacks automatically if packed
if (err_billing.isExact(error)) {
  error.getContext("payment_failed").reason; // "card declined" — fully restored
}
```

Manual unpacking is also available but rarely needed:

```ts
const error = castNiceError(caught).unpack();
```

## Domain-level defaults

Set a default pack strategy on the domain so every error it creates is automatically packed when thrown:

```ts
import { EErrorPackType } from "@nice-error/core";

const err_durable = defineNiceError({
  domain: "err_durable",
  schema: { ... },
  packAs: () => EErrorPackType.msg_pack,
});
```

Or set it imperatively after creation:

```ts
err_durable.packAs(EErrorPackType.msg_pack);
```

Child domains inherit the parent's pack strategy.

## When to use each strategy

| Strategy | Use when |
|---|---|
| `msg_pack` | Only `error.message` crosses the boundary (Durable Objects, some worker runtimes) |
| `cause_pack` | `error.cause` is preserved; you want a human-readable `message` |
| None (default) | Boundaries that preserve the full error object (standard HTTP, structured cloning) |
