import type { BaseIssue } from "valibot";

export interface IErrContext_Valibot {
  issues: readonly BaseIssue<any>[];
}
