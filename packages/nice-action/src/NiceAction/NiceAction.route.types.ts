import type { EActionRequestExpectation, EActionRouteStep } from "./NiceAction.enums";

export interface IActionRouteEntry<E extends EActionRouteStep = EActionRouteStep> {
  runtime: string;
  step: E;
  time: number;
  handleTarget?: string;
}

export interface IActionRouteEntry_RequestStart
  extends IActionRouteEntry<EActionRouteStep.start_request> {
  step: EActionRouteStep.start_request;
  expectation: EActionRequestExpectation;
}
