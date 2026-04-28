import {
  defineNiceError,
  err,
  err_cast_not_nice,
  type InferNiceError,
  NiceError,
} from "@nice-code/error";
import * as v from "valibot";
import { expect, expectTypeOf, test, vi } from "vitest";
import { action } from "../ActionSchema/action";
import type { TInferActionError } from "../ActionSchema/NiceActionSchema";
import { createActionRootDomain } from "./helpers/createRootActionDomain";
import type { TPossibleDomainIdList } from "./NiceActionDomain.types";

// ---------------------------------------------------------------------------
// Domain structure — domain / allDomains base types
// ---------------------------------------------------------------------------

test("[NiceActionRootDomain] root domain has correct domain and allDomains types", () => {
  const root = createActionRootDomain({
    domain: "root_domain",
  });

  expectTypeOf(root.domain).toBeString();
  type _SatisfiesConstraint = typeof root.allDomains extends TPossibleDomainIdList ? true : false;
  expectTypeOf<_SatisfiesConstraint>().toEqualTypeOf<true>();
});

test("[NiceActionDomain] domain property is a string", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "payments",
    actions: { pay: action().input({ schema: v.object({ amount: v.number() }) }) },
  });

  // The implementation spreads allDomains as an array, so TypeScript resolves
  // domain/allDomains against the default INiceActionDomainDef (string-based).
  expectTypeOf(dom.domain).toBeString();
});

test("[NiceActionDomain] allDomains satisfies TNiceActionDomainIds (non-empty tuple constraint)", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "orders",
    actions: { create: action().input({ schema: v.object({ sku: v.string() }) }) },
  });

  type ActualAllDomains = typeof dom.allDomains;
  type _SatisfiesConstraint = ActualAllDomains extends TPossibleDomainIdList ? true : false;
  expectTypeOf<_SatisfiesConstraint>().toEqualTypeOf<true>();
});

// ---------------------------------------------------------------------------
// .action() — execute input and output types
// ---------------------------------------------------------------------------

test("[NiceActionDomain.action] execute() input is typed to the action schema", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "catalog",
    actions: {
      search: action().input({ schema: v.object({ query: v.string(), limit: v.number() }) }),
    },
  });

  const searchAction = dom.action("search");
  type Input = Parameters<typeof searchAction.execute>[0];
  expectTypeOf<Input>().toEqualTypeOf<{ query: string; limit: number }>();
});

test("[NiceActionDomain.action] execute() return type is typed to the output schema", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "reports",
    actions: {
      generate: action()
        .input({ schema: v.object({ from: v.string() }) })
        .output({ schema: v.object({ url: v.string(), size: v.number() }) }),
    },
  });

  const generateAction = dom.action("generate");
  type Output = Awaited<ReturnType<typeof generateAction.execute>>;
  expectTypeOf<Output>().toEqualTypeOf<{ url: string; size: number }>();
});

test("[NiceActionDomain.action] execute() without output schema returns never", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "fire_and_forget",
    actions: {
      emit: action().input({ schema: v.object({ event: v.string() }) }),
    },
  });

  const emitAction = dom.action("emit");
  type Output = Awaited<ReturnType<typeof emitAction.execute>>;
  expectTypeOf<Output>().toBeNever();
});

test("[NiceActionDomain.isDomainAction] narrows unknown to domain Action", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "guard_test",
    actions: { foo: action().input({ schema: v.object({ x: v.number() }) }) },
  });

  const shouldNotExecute = vi.fn();

  // Inside the true branch, the type is narrowed to NiceActionPrimed with the domain's schema.

  const unknown: unknown = {};
  if (dom.isDomainAction(unknown)) {
    // shouldn't execute
    shouldNotExecute();
  }

  expect(shouldNotExecute).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// createChildDomain — schema and allDomains structure
// ---------------------------------------------------------------------------

test("[NiceActionDomain.createChildDomain] child has its own action schema", () => {
  const parent = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "parent_dom",
    actions: { ping: action().input({ schema: v.object({ v: v.string() }) }) },
  });

  const child = parent.createChildDomain({
    domain: "child_dom",
    actions: { pong: action().input({ schema: v.object({ reply: v.string() }) }) },
  });

  const pongAction = child.action("pong");
  type Input = Parameters<typeof pongAction.execute>[0];
  expectTypeOf<Input>().toEqualTypeOf<{ reply: string }>();
});

test("[NiceActionDomain.createChildDomain] allDomains is a non-empty tuple containing both domains", () => {
  const parent = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "root_dom",
    actions: { ping: action().input({ schema: v.object({}) }) },
  });

  const child = parent.createChildDomain({
    domain: "leaf_dom",
    actions: { pong: action().input({ schema: v.object({}) }) },
  });

  // The allDomains tuple has the child domain at index 0 and includes the parent.
  type AllDomains = typeof child.allDomains;
  type _SatisfiesConstraint = AllDomains extends TPossibleDomainIdList ? true : false;
  expectTypeOf<_SatisfiesConstraint>().toEqualTypeOf<true>();

  // Has at least two entries (child + parent).
  type _HasParent = AllDomains extends [string, string, ...string[]] ? true : false;
  expectTypeOf<_HasParent>().toEqualTypeOf<true>();
});

// ---------------------------------------------------------------------------
// TInferActionError on domain schemas
// ---------------------------------------------------------------------------

test("[TInferActionError] declared on schema used in domain — IDs flow through", () => {
  const err_billing = defineNiceError({
    domain: "err_billing_domain_test",
    schema: {
      payment_failed: err({ message: "Payment failed" }),
      refund_denied: err({ message: "Refund denied" }),
    },
  } as const);

  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "billing",
    actions: {
      charge: action()
        .input({ schema: v.object({ amount: v.number() }) })
        .throws(err_billing),
      refund: action()
        .input({ schema: v.object({ txId: v.string() }) })
        .throws(err_billing, ["refund_denied"] as const),
    },
  });

  // charge declares the full billing domain — both IDs must appear.
  type ChargeErr = TInferActionError<typeof dom.actions.charge>;
  type ChargeIds = ChargeErr extends NiceError<any, infer IDS extends string> ? IDS : never;

  type HasPaymentFailed = "payment_failed" extends ChargeIds ? true : false;
  expectTypeOf<HasPaymentFailed>().toEqualTypeOf<true>();

  type HasRefundDenied_Charge = "refund_denied" extends ChargeIds ? true : false;
  expectTypeOf<HasRefundDenied_Charge>().toEqualTypeOf<true>();

  // refund declares only "refund_denied" — "payment_failed" must NOT appear.
  type RefundErr = TInferActionError<typeof dom.actions.refund>;
  type RefundIds = RefundErr extends NiceError<any, infer IDS extends string> ? IDS : never;

  type HasPaymentFailed_Refund = "payment_failed" extends RefundIds ? true : false;
  expectTypeOf<HasPaymentFailed_Refund>().toEqualTypeOf<false>();

  type HasRefundDenied_Refund = "refund_denied" extends RefundIds ? true : false;
  expectTypeOf<HasRefundDenied_Refund>().toEqualTypeOf<true>();
});

test("[TInferActionError] err_cast_not_nice is always present regardless of .throws()", () => {
  const dom = createActionRootDomain({
    domain: "test_root",
  }).createChildDomain({
    domain: "always_cast",
    actions: {
      noop: action().input({ schema: v.object({ x: v.number() }) }),
    },
  });

  type NoopErr = TInferActionError<typeof dom.actions.noop>;
  type CastIds =
    InferNiceError<typeof err_cast_not_nice> extends NiceError<any, infer IDS extends string>
      ? IDS
      : never;
  type AllIds = NoopErr extends NiceError<any, infer IDS extends string> ? IDS : never;

  // Every ID from err_cast_not_nice must be present even with no .throws().
  type AllCastPresent = CastIds extends AllIds ? true : false;
  expectTypeOf<AllCastPresent>().toEqualTypeOf<true>();
});
