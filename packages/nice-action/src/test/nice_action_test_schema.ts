import type { JSONSerializableValue } from "@nice-code/error";
import * as v from "valibot";
import { createActionDomain } from "../ActionDomain/createActionDomain";
import { action } from "../ActionSchema/action";
import type { INiceActionPrimed_JsonObject } from "../NiceAction/NiceAction.types";

export const demo_domain = createActionDomain({
  domain: "demo_domain",
  actions: {
    action1: action().input({
      schema: v.object({
        a: v.string(),
        cust: v.custom<JSONSerializableValue>(() => true),
      }),
    }),
    action2: action().input({
      schema: v.object({
        b: v.string(),
        custBad: v.custom<INiceActionPrimed_JsonObject>(() => true),
      }),
    }),
  },
});
