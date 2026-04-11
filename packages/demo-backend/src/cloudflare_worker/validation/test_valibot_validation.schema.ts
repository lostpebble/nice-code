import * as v from "valibot";

export const vTestValidationObject = v.object({
  color: v.string(),
  size: v.optional(v.number()),
  users: v.array(
    v.object({
      name: v.string(),
      isAdmin: v.boolean(),
      internal: v.symbol("internal"),
    }),
  ),
});
