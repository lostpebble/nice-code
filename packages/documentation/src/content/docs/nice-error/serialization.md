---
title: Serialization
description: Send errors across the wire, reconstruct them fully typed on the other side.
---

A nice-code error survives serialization. Stringify it, send it over HTTP / IPC / a queue, and `deserialize` reconstructs the _same class_ with the _same payload_ on the other side.

## On the server

```ts title="server.ts"
import { NiceError } from "@nice-code/error"

try {
  await handler(req)
} catch (e) {
  if (NiceError.is(e)) {
    return new Response(NiceError.serialize(e), {
      status: 400,
      headers: { "content-type": "application/nice-error+json" },
    })
  }
  throw e
}
```

`NiceError.serialize(e)` returns a JSON string containing the domain, variant, payload, and (optionally) the stack.

## On the client

```ts title="client.ts"
import { UserError, BillingError } from "./errors"

const res = await fetch("/api/charge")
if (res.headers.get("content-type") === "application/nice-error+json") {
  const err = NiceError.deserialize(
    await res.text(),
    [UserError, BillingError],
  )

  if (BillingError.CardDeclined.is(err)) {
    // err.payload is fully typed
    toast(`Card declined: ${err.payload.reason}`)
  }
}
```

The second argument is the list of domains the deserializer is allowed to reconstruct. This is a security feature — unknown domains are returned as a generic `NiceError` wrapper, never as arbitrary code.

## Wire format

```json
{
  "$kind": "nice-error",
  "domain": "billing",
  "variant": "CardDeclined",
  "payload": { "code": "insufficient_funds", "reason": "insufficient funds" },
  "stack": "…optional…"
}
```

The `$kind` sentinel lets deserializers reject any JSON that isn't a nice-error envelope.

## Strip or keep the stack

```ts
NiceError.serialize(e, { stack: false })     // production
NiceError.serialize(e, { stack: true })      // dev
NiceError.serialize(e, { stack: "redacted" }) // keep lines but remove file paths
```

Default: `true` in development, `false` in production (based on `process.env.NODE_ENV`).

## With unknown domains

```ts
const err = NiceError.deserialize(raw, [UserError])

if (NiceError.isUnknown(err)) {
  // We got a nice-error, but from a domain we don't know about.
  // err.domain / err.variant / err.payload are all present as unknown
  logger.warn("unknown error domain", err.domain, err.variant)
}
```

## Not just JSON

`serialize` returns a string; `toJSON` returns the raw object. Use `toJSON` for structured-clone contexts (workers, IndexedDB, BroadcastChannel).

```ts
worker.postMessage({ error: e.toJSON() })
// receiver:
const err = NiceError.fromJSON(msg.error, [UserError])
```
