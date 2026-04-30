import type { NiceError } from "@nice-code/error";
import { EActionState } from "../../../NiceAction/NiceAction.enums";
import type {
  INiceActionPrimed_JsonObject,
  TNiceActionResponse_JsonObject,
} from "../../../NiceAction/NiceAction.types";
import { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";
import { isActionResponseJsonObject } from "../../../utils/isActionResponseJsonObject";
import { EErrId_NiceTransport_WebSocket, err_nice_transport_ws } from "./err_nice_transport_ws";
import { Transport } from "./Transport";
import {
  ETransportStatus,
  type IActionTransportDef_Ws,
  type ICustomWebsocketMessageSerde,
  type ITransportInitializationFinishedInfo,
  type ITransportStatusInfo_Base,
  type ITransportStatusInfo_Failed,
  type ITransportStatusInfo_Initializing,
  type TOnResolveIncomingRequest,
  type TTransportStatusInfo,
} from "./Transport.types";

export class TransportWebSocket extends Transport<IActionTransportDef_Ws> {
  websocket?: WebSocket;

  protected _status: TTransportStatusInfo = { status: ETransportStatus.uninitialized };
  private _customMessageSerde?: ICustomWebsocketMessageSerde;

  constructor(def: IActionTransportDef_Ws, onResolveIncomingPrimed?: TOnResolveIncomingRequest) {
    super(def, onResolveIncomingPrimed);
  }

  override checkAndPrepare(): TTransportStatusInfo {
    if (this._status.status === ETransportStatus.uninitialized) {
      this._status = this.startInitializing();
    }
    return this._status;
  }

  private startInitializing(): ITransportStatusInfo_Initializing {
    let resolveInit!: (info: ITransportInitializationFinishedInfo) => void;
    const waitForInitialization = new Promise<ITransportInitializationFinishedInfo>((resolve) => {
      resolveInit = resolve;
    });

    this._connect(resolveInit);

    return {
      status: ETransportStatus.initializing,
      timeStarted: Date.now(),
      waitForInitialization,
    };
  }

  private handlePureActionMessage(
    message: string,
  ): TNiceActionResponse_JsonObject<any> | INiceActionPrimed_JsonObject<any> | undefined {
    let json: unknown;
    try {
      json = JSON.parse(message);
    } catch {
      return;
    }

    if (!isActionResponseJsonObject(json)) {
      return;
    }

    return json;
  }

  private handleIncomingActionPayload(
    actionPayload: TNiceActionResponse_JsonObject<any> | INiceActionPrimed_JsonObject<any>,
  ): void {
    if (actionPayload.type === EActionState.primed) {
      this.resolveIncomingPrimed(actionPayload);
      return;
    }

    const pending = this.requestResolvers.get(actionPayload.cuid);
    if (pending == null) {
      return;
    }

    this.resolveIncomingResponse(
      pending.primed.coreAction.actionDomain.hydrateResponse(actionPayload),
    );
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

  private async _connect(
    onInitialized: (info: ITransportInitializationFinishedInfo) => void,
  ): Promise<void> {
    type TInitStatus =
      | ITransportStatusInfo_Base<ETransportStatus.ready>
      | ITransportStatusInfo_Failed;
    let initNotified = false;
    const notifyInit = (newStatus: TInitStatus) => {
      if (!initNotified) {
        initNotified = true;
        onInitialized({ transport: this, newStatus });
      }
    };

    try {
      const { ws, customMessageSerde } = await this.def.createWebSocket();
      this.websocket = ws;
      this._customMessageSerde = customMessageSerde;
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      const error = err_nice_transport_ws.fromId(EErrId_NiceTransport_WebSocket.ws_create_failed, {
        originalError: e instanceof Error ? e : undefined,
      });
      const failedStatus: ITransportStatusInfo_Failed = {
        status: ETransportStatus.failed,
        error,
        timeFailed: Date.now(),
      };
      this._status = failedStatus;
      notifyInit(failedStatus);
      this.rejectPendingWebSocketRequests(error);
      return;
    }

    this.websocket.addEventListener("open", () => {
      const readyStatus: ITransportStatusInfo_Base<ETransportStatus.ready> = {
        status: ETransportStatus.ready,
      };
      this._status = readyStatus;
      notifyInit(readyStatus);
    });

    this.websocket.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        const response:
          | TNiceActionResponse_JsonObject<any>
          | INiceActionPrimed_JsonObject<any>
          | undefined =
          this._customMessageSerde?.incoming?.(event.data) ??
          this.handlePureActionMessage(event.data);

        if (response) {
          this.handleIncomingActionPayload(response);
        }
      }
    });

    this.websocket.addEventListener("close", (event) => {
      // Intentional disconnect sets status to uninitialized first — don't overwrite it
      if (this._status.status === ETransportStatus.uninitialized) return;
      // Error event may have already set failed — avoid double-reject
      if (this._status.status !== ETransportStatus.failed) {
        console.error("WebSocket closed:", event);
        const error = err_nice_transport_ws.fromId(EErrId_NiceTransport_WebSocket.ws_disconnected);
        const failedStatus: ITransportStatusInfo_Failed = {
          status: ETransportStatus.failed,
          error,
          timeFailed: Date.now(),
        };
        this._status = failedStatus;
        notifyInit(failedStatus);
        this.rejectPendingWebSocketRequests(error);
      }
    });

    this.websocket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      const error = err_nice_transport_ws.fromId(EErrId_NiceTransport_WebSocket.ws_error, {
        originalError: event instanceof Error ? event : undefined,
      });
      const failedStatus: ITransportStatusInfo_Failed = {
        status: ETransportStatus.failed,
        error,
        timeFailed: Date.now(),
      };
      this._status = failedStatus;
      notifyInit(failedStatus);
      this.rejectPendingWebSocketRequests(error);
    });
  }

  protected async send(action: NiceActionPrimed<any> | NiceActionResponse<any>): Promise<void> {
    if (this.websocket == null) {
      throw err_nice_transport_ws.fromId(EErrId_NiceTransport_WebSocket.ws_disconnected);
    }

    this.websocket.send(action.toJsonString());
  }

  disconnect(): void {
    const error = err_nice_transport_ws.fromId(EErrId_NiceTransport_WebSocket.ws_disconnected);
    // Set uninitialized before close() so the close event handler skips the failed transition
    this._status = { status: ETransportStatus.uninitialized };
    this.rejectPendingWebSocketRequests(error);
    this.websocket?.close();
    this.websocket = undefined;
  }
}
