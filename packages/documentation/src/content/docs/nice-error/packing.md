---
title: Packing
description: Batch multiple errors into a single serializable envelope.
---

Sometimes one operation produces _many_ errors — form validation, bulk imports, or batch writes. `NiceError.pack` lets you serialize a collection as one envelope.

## Pack

```ts
import { NiceError } from "@nice-code/error"

const errors = [
  new ValidationError.Field({ field: "email", rule: "format" }),
  new ValidationError.Field({ field: "password", rule: "length" }),
]

const packed = NiceError.pack(errors)
// => { $kind: "nice-error-pack", errors: [ { … }, { … } ] }
```

Send `packed` over the wire as regular JSON.

## Unpack

```ts
const unpacked = NiceError.unpack(packed, [ValidationError])

for (const e of unpacked) {
  if (ValidationError.Field.is(e)) {
    setFieldError(e.payload.field, e.payload.rule)
  }
}
```

## Integrating with forms

```ts title="validate.ts"
export function validateSignup(form: Signup): ValidationError.Field[] {
  const errors: ValidationError.Field[] = []
  if (!form.email.includes("@")) {
    errors.push(new ValidationError.Field({ field: "email", rule: "format" }))
  }
  if (form.password.length < 8) {
    errors.push(new ValidationError.Field({ field: "password", rule: "length" }))
  }
  return errors
}
```

```ts title="handler.ts"
const errs = validateSignup(form)
if (errs.length) {
  return new Response(JSON.stringify(NiceError.pack(errs)), { status: 400 })
}
```

## Grouping by domain

```ts
const groups = NiceError.groupByDomain(unpacked)
// => { validation: [...], rateLimit: [...] }
```

## Merging packs

```ts
const merged = NiceError.mergePacks(pack1, pack2, pack3)
```

All packs must contain the same `$kind` sentinel, otherwise `mergePacks` throws.

## Size cap

Packs are capped at 1,000 errors by default. Override with `{ max }`:

```ts
NiceError.pack(errors, { max: 10_000 })
```
