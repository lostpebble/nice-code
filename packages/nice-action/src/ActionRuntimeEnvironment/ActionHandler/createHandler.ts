import { ActionHandler } from "./ActionHandler";
import type { IActionHandlerConfig } from "./ActionHandler.types";

export const createHandler = (config: IActionHandlerConfig = {}) => {
  return new ActionHandler(config);
};
