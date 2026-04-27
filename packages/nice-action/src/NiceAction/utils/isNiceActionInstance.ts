import { EActionState } from "../NiceAction.enums";
import type { INiceAction } from "../NiceAction.types";
import type { TNarrowActionType } from "../NiceActionCombined.types";

export function isNiceActionInstance<ACT extends INiceAction<any>>(
  value: unknown | ACT,
): value is TNarrowActionType<ACT, any, any> {
  return (
    value != null &&
    typeof value === "object" &&
    "domain" in value &&
    typeof (value as { domain: unknown }).domain === "string" &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string" &&
    [EActionState.empty, EActionState.primed, EActionState.resolved].includes(
      (value as { type: string }).type as EActionState,
    )
  );
}
