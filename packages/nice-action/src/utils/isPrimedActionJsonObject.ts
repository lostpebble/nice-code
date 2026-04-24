import { EActionState } from "../NiceAction/NiceAction.enums";
import type { INiceActionPrimed_JsonObject } from "../NiceAction/NiceAction.types";

export const isPrimedActionJsonObject = (obj: unknown): obj is INiceActionPrimed_JsonObject => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).domain === "string" &&
    typeof (obj as any).id === "string" &&
    "input" in (obj as any) &&
    (obj as any).type === EActionState.primed
  );
};
