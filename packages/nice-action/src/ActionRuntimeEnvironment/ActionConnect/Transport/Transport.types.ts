import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";

export enum ETransportType {
  ws = "ws",
  http = "http",
}

export interface IActionTransport_Base {
  /** Per-transport timeout override (ms) */
  timeout?: number;
}

export interface IActionTransportDef_Ws extends IActionTransport_Base {
  type: ETransportType.ws;
  createWebSocket: () => Promise<WebSocket>;
}

export interface IActionTransportDef_Http extends IActionTransport_Base {
  type: ETransportType.http;
  url: string;
}

export type TActionTransportDef = IActionTransportDef_Ws | IActionTransportDef_Http;

export interface ITransportPendingRequest {
  type: ETransportType;
  resolve: (response: NiceActionResponse<any>) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
  primed: NiceActionPrimed<any>;
}
