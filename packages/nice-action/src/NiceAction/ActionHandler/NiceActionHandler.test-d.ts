/**
 * Type tests for NiceActionHandler.
 *
 * Verifies that handler registration methods correctly narrow input types, that
 * chaining returns `this`, and that the broad / default handler receives the
 * generic primed-action type.
 */
import * as v from "valibot";
import { assertType, expectTypeOf, test } from "vitest";
import { action } from "../ActionSchema/action";
import type { NiceActionSchema } from "../ActionSchema/NiceActionSchema";
import { createActionDomain } from "../createActionDomain";
import type { INiceActionDomain } from "../NiceActionDomain.types";
import type { NiceActionPrimed } from "../NiceActionPrimed";
import { NiceActionHandler } from "./NiceActionHandler";

// ---------------------------------------------------------------------------
// Shared domain for all handler type tests
// ---------------------------------------------------------------------------

const dom = createActionDomain({
  domain: "handler_type_test",
  schema: {
    setName: action().input({ schema: v.object({ name: v.string() }) }),
    setAge: action().input({ schema: v.object({ age: v.number() }) }),
    greet: action()
      .input({ schema: v.object({ name: v.string() }) })
      .output({ schema: v.object({ greeting: v.string() }) }),
  },
});

// ---------------------------------------------------------------------------
// forActionId — input narrowing
// ---------------------------------------------------------------------------

test("[forActionId] act.input is narrowed to the specific action's input type", () => {
  new NiceActionHandler().forActionId(dom, "setName", (act) => {
    expectTypeOf(act.input).toEqualTypeOf<{ name: string }>();
  });
});

test("[forActionId] act.input is narrowed for a different action id", () => {
  new NiceActionHandler().forActionId(dom, "setAge", (act) => {
    expectTypeOf(act.input).toEqualTypeOf<{ age: number }>();
  });
});

test("[forActionId] act.input for an action with output schema is still narrowed", () => {
  new NiceActionHandler().forActionId(dom, "greet", (act) => {
    expectTypeOf(act.input).toEqualTypeOf<{ name: string }>();
  });
});

// ---------------------------------------------------------------------------
// forActionIds — union narrowing
// ---------------------------------------------------------------------------

test("[forActionIds] act.input is the union of the listed action input types", () => {
  new NiceActionHandler().forActionIds(dom, ["setName", "setAge"] as const, (act) => {
    expectTypeOf(act.input).toEqualTypeOf<{ name: string } | { age: number }>();
  });
});

test("[forActionIds] single-item list narrows to that action's type", () => {
  new NiceActionHandler().forActionIds(dom, ["setAge"] as const, (act) => {
    expectTypeOf(act.input).toEqualTypeOf<{ age: number }>();
  });
});

// ---------------------------------------------------------------------------
// forDomain / setDefaultHandler — broad type
// ---------------------------------------------------------------------------

test("[forDomain] handler receives the generic NiceActionPrimed type", () => {
  new NiceActionHandler().forDomain(dom, (act) => {
    assertType<NiceActionPrimed<INiceActionDomain, NiceActionSchema<any, any, any>>>(act);
  });
});

test("[setDefaultHandler] handler receives the generic NiceActionPrimed type", () => {
  new NiceActionHandler().setDefaultHandler((act) => {
    assertType<NiceActionPrimed<INiceActionDomain, NiceActionSchema<any, any, any>>>(act);
  });
});

// ---------------------------------------------------------------------------
// Chaining — all methods return this
// ---------------------------------------------------------------------------

test("[NiceActionHandler] all registration methods return the handler instance", () => {
  const h = new NiceActionHandler();
  assertType<NiceActionHandler>(h.forActionId(dom, "setName", () => {}));
  assertType<NiceActionHandler>(h.forActionIds(dom, ["setAge"] as const, () => {}));
  assertType<NiceActionHandler>(h.forDomain(dom, () => {}));
  assertType<NiceActionHandler>(h.setDefaultHandler(() => {}));
});

test("[NiceActionHandler] chaining forActionId → forDomain → setDefaultHandler compiles", () => {
  const h = new NiceActionHandler()
    .forActionId(dom, "setName", () => {})
    .forActionIds(dom, ["setAge"] as const, () => {})
    .forDomain(dom, () => {})
    .setDefaultHandler(() => {});
  assertType<NiceActionHandler>(h);
});
