import { err_nice_action } from "../../errors/err_nice_action";

export const err_nice_connect = err_nice_action.createChildDomain({
  domain: "err_nice_connect",
  schema: {},
});
