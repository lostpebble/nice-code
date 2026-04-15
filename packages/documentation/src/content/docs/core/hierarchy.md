---
title: Domain Hierarchy
description: Organize error domains into parent-child trees with inherited ancestry.
---

Error domains can form a hierarchy. Child domains inherit their parent's ancestry chain, which powers ancestry checks and type narrowing.

## Creating a child domain

```ts
const err_app = defineNiceError({ domain: "err_app", schema: {} });

const err_auth = err_app.createChildDomain({
  domain: "err_auth",
  schema: {
    unauthorized: err({ message: "Unauthorized", httpStatusCode: 401 }),
    session_expired: err({ message: "Session expired", httpStatusCode: 401 }),
  },
});

const err_billing = err_app.createChildDomain({
  domain: "err_billing",
  schema: {
    payment_failed: err<{ reason: string }>({
      message: ({ reason }) => `Payment failed: ${reason}`,
      httpStatusCode: 402,
      context: { required: true },
    }),
  },
});
```

`err_auth.allDomains` will be `["err_app", "err_auth"]`.

## Ancestry checks

### `isParentOf(target)`

Accepts a domain or an error instance:

```ts
err_app.isParentOf(err_auth);  // true — err_auth is a child domain
err_app.isParentOf(err_billing); // true

const error = err_auth.fromId("unauthorized");
err_app.isParentOf(error);     // true — error's domain is a child
err_auth.isParentOf(error);    // false — isParentOf is strictly ancestral, not self
```

### `isExact(error)`

Exact match only — does not fire for child domains:

```ts
err_auth.isExact(error);  // true — exact match
err_app.isExact(error);   // false — err_app is a parent, not an exact match
```

### `isThisOrChild(error)`

Matches self and all descendants:

```ts
err_app.isThisOrChild(error);  // true — covers err_app and all children
err_auth.isThisOrChild(error); // true — exact match
```

## Multi-level hierarchies

Hierarchies can be arbitrarily deep:

```ts
const err_payment = err_billing.createChildDomain({
  domain: "err_payment",
  schema: { gateway_timeout: err({ message: "Gateway timeout", httpStatusCode: 504 }) },
});

// err_payment.allDomains = ["err_app", "err_billing", "err_payment"]

err_app.isParentOf(err_payment);     // true
err_billing.isParentOf(err_payment); // true
err_app.isThisOrChild(error_from_payment_domain); // true
```

## Routing by hierarchy

`forDomain` in `handleWith` matches on the exact domain, not ancestry. For hierarchy-aware routing, use `isThisOrChild` as a pre-check:

```ts
// Handle any app-level error from any sub-domain
if (err_app.isThisOrChild(error)) {
  console.log(`App error: ${error.message}`);
}
```
