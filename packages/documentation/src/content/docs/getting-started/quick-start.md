---
title: Quick Start
description: Get up and running with @nice-error/core and @nice-error/nice-action.
---

## Install

```bash
# errors only
bun add @nice-error/core

# errors + actions
bun add @nice-error/nice-action
```

## @nice-error/core in 5 minutes

### 1. Define an error domain

```ts
import { defineNiceError, err } from "@nice-error/core";

const err_billing = defineNiceError({
  domain: "err_billing",
  schema: {
    payment_failed: err<{ reason: string }>({
      message: ({ reason }) => `Payment failed: ${reason}`,
      httpStatusCode: 402,
      context: { required: true },
    }),
    card_expired: err({
      message: "Card has expired",
      httpStatusCode: 402,
    }),
  },
});
```

### 2. Create and throw an error

```ts
throw err_billing.fromId("payment_failed", { reason: "card declined" });
```

### 3. Catch and narrow it

```ts
import { castNiceError } from "@nice-error/core";
import { forDomain, forIds } from "@nice-error/core";

try {
  await processPayment();
} catch (e) {
  const error = castNiceError(e);

  error.handleWith([
    forIds(err_billing, ["payment_failed"], (h) => {
      const { reason } = h.getContext("payment_failed");
      res.status(402).json({ reason });
    }),
    forDomain(err_billing, (h) => {
      res.status(h.httpStatusCode).json({ error: h.message });
    }),
  ]);
}
```

### 4. Serialize across a boundary

```ts
// Server
return Response.json(error.toJsonObject(), { status: error.httpStatusCode });

// Client
const body = await res.json();
const error = castNiceError(body);           // reconstructs from JSON
if (err_billing.isExact(error)) {
  error.hasId("payment_failed");             // true — type guard works on hydrated error
}
```

---

## @nice-error/nice-action in 5 minutes

### 1. Define an action domain

```ts
import { createActionDomain, action } from "@nice-error/nice-action";
import * as v from "valibot";

const user_domain = createActionDomain({
  domain: "user_domain",
  actions: {
    getUser: action()
      .input({ schema: v.object({ userId: v.string() }) })
      .output({ schema: v.object({ id: v.string(), name: v.string() }) }),
    deleteUser: action()
      .input({ schema: v.object({ userId: v.string() }) }),
  },
});
```

### 2. Register a handler

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

### 3. Execute

```ts
// Throws on error
const user = await user_domain.action("getUser").execute({ userId: "u1" });

// Safe — returns { ok: true, output } | { ok: false, error }
const result = await user_domain.action("getUser").executeSafe({ userId: "u1" });
if (result.ok) {
  console.log(result.output.name);
}
```

### 4. Use a resolver for local execution (no requester needed)

```ts
import { createDomainResolver } from "@nice-error/nice-action";

user_domain.registerResponder(
  createDomainResolver(user_domain)
    .resolveAction("getUser", ({ userId }) => db.findUser(userId))
    .resolveAction("deleteUser", ({ userId }) => db.deleteUser(userId)),
);

const user = await user_domain.action("getUser").execute({ userId: "u1" });
```
