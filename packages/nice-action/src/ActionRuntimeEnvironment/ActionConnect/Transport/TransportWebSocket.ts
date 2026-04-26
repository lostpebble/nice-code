import type { NiceError } from "@nice-code/error";
import type { INiceActionPrimed_JsonObject } from "../../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import { isActionResponseJsonObject } from "../../../utils/isActionResponseJsonObject";
import { EErrId_NiceTransport, err_nice_transport } from "./err_nice_transport";
import { Transport } from "./Transport";
import type { IActionTransportDef_Ws } from "./Transport.types";

export class TransportWebSocket extends Transport<IActionTransportDef_Ws> {
  connected: boolean = false;
  websocket?: WebSocket;

  constructor(def: IActionTransportDef_Ws) {
    super(def);
  }

  private handleMessage(data: string): void {
    let json: unknown;
    try {
      json = JSON.parse(data);
    } catch {
      return;
    }

    if (!isActionResponseJsonObject(json)) {
      return;
    }

    const pending = this.requestResolvers.get(json.cuid);
    if (pending == null) {
      return;
    }

    this.respond(pending.primed.coreAction.actionDomain.hydrateResponse(json));
  }

  private rejectPendingWebSocketRequests(error: NiceError): void {
    for (const [, pending] of this.requestResolvers) {
      if (pending.type === this.type) {
        clearTimeout(pending.timer);
        pending.reject(error);
        this.requestResolvers.delete(pending.primed.cuid);
      }
    }
  }

  private createWebSocketConnection(initialPayload: INiceActionPrimed_JsonObject): void {
    this.websocket = this.def.createWebSocket();

    this.websocket.addEventListener("open", () => {
      this.connected = true;
      this.websocket?.send(JSON.stringify(initialPayload));
    });

    this.websocket.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        this.handleMessage(event.data);
      }
    });

    this.websocket.addEventListener("close", (event) => {
      console.error("WebSocket closed:", event);
      this.connected = false;
      this.rejectPendingWebSocketRequests(
        err_nice_transport.fromId(EErrId_NiceTransport.transport_ws_disconnected),
      );
    });

    this.websocket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      this.connected = false;
      this.rejectPendingWebSocketRequests(
        err_nice_transport.fromId(EErrId_NiceTransport.transport_ws_send_failed),
      );
    });

    return;
  }

  protected send(primed: NiceActionPrimed<any>): void {
    const wire = primed.toJsonObject();

    if (!this.connected) {
      this.createWebSocketConnection(wire);
      return;
    }

    this.websocket?.send(JSON.stringify(wire));
  }

  disconnect(): void {
    this.connected = false;
    this.websocket?.close();
    this.websocket = undefined;
  }
}
