import { err, err_nice } from "@nice-error/core";
import { StatusCodes } from "http-status-codes";
import type { IErrContext_Valibot } from "./err_validation.types";

export enum EValidator {
  valibot = "valibot",
}

export const err_validation = err_nice.createChildDomain({
  domain: "err_validation",
  httpStatusCode: StatusCodes.BAD_REQUEST,
  schema: {
    [EValidator.valibot]: err<IErrContext_Valibot>({
      message: "Validation failed: valibot",
    }),
  },
});
