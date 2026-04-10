import * as v from "valibot";

export const vSimpleObject = v.object({
  color: v.string(),
  size: v.optional(v.number()),
});
