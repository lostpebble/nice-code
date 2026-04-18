---
title: Wire format
description: The exact shape of action requests and responses on the wire.
---

nice-code uses a minimal, versioned JSON envelope. If you inspect network traffic in DevTools, here's what you'll see.

## Request

```http
POST /api/billing HTTP/1.1
content-type: application/nice-action+json

{
  "$v": 1,
  "action": "chargeCard",
  "input": { "amount": 5000, "currency": "USD" }
}
```

Fields:

| Field | Type | Notes |
|---|---|---|
| `$v` | `1` | Protocol version. Clients reject unknown versions. |
| `action` | `string` | Must exist in the server's domain. |
| `input` | `object` | Parsed and passed to the resolver. |

## Success response

```http
HTTP/1.1 200 OK
content-type: application/nice-action+json

{
  "$v": 1,
  "ok": true,
  "output": { "chargeId": "ch_..." }
}
```

## Error response

```http
HTTP/1.1 400 Bad Request
content-type: application/nice-action+json

{
  "$v": 1,
  "ok": false,
  "error": {
    "$kind": "nice-error",
    "domain": "billing",
    "variant": "CardDeclined",
    "payload": { "code": "insufficient_funds", "reason": "insufficient funds" }
  }
}
```

Status code mapping (override with `httpStatus()` — see below):

| Error variant extends | HTTP |
|---|---|
| `HttpError.BadRequest`     | 400 |
| `HttpError.Unauthorized`   | 401 |
| `HttpError.Forbidden`      | 403 |
| `HttpError.NotFound`       | 404 |
| `HttpError.Conflict`       | 409 |
| `HttpError.RateLimited`    | 429 |
| _anything else_            | 500 |

## Custom status codes

Declare per-variant overrides on the domain:

```ts
const BillingError = NiceError.domain("billing", {
  CardDeclined:      { reason: "", code: "" },
  InsufficientFunds: { required: 0, available: 0 },
}, {
  httpStatus: {
    CardDeclined: 402,          // Payment Required
    InsufficientFunds: 402,
  },
})
```

## Non-JSON payloads

For binary uploads / streams, pair nice-action with a secondary channel and pass the reference through the action. nice-code intentionally does not handle multipart.

## Protocol negotiation

Clients send `accept: application/nice-action+json`. If the server can't speak v1, it replies `406 Not Acceptable` with a `{ "$v": …, "supported": [1] }` body.
