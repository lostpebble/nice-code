import { err, err_nice } from "@nice-error/core";
import { StatusCodes } from "http-status-codes";
import type { IErrContext_HonoStandardSchema } from "./err_validation.types";
import { extractMessageFromStandardSchema } from "./standard_schema/extractMessageFromStandardSchema";

export enum EValidator {
  standard_schema = "standard_schema",
}

export const err_validation = err_nice.createChildDomain({
  domain: "err_validation",
  defaultHttpStatusCode: StatusCodes.BAD_REQUEST,
  schema: {
    [EValidator.standard_schema]: err<IErrContext_HonoStandardSchema>({
      message: ({ issues }) => extractMessageFromStandardSchema({ issues }),
    }),
  },
});
