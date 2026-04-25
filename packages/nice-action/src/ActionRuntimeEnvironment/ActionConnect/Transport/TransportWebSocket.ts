import { castNiceError } from "@nice-code/error";
import type { TNiceActionResponse_JsonObject } from "../../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import { isActionResponseJsonObject } from "../../../utils/isActionResponseJsonObject";
import { EErrId_NiceConnect, err_nice_connect } from "../err_nice_connect";
import { Transport } from "./Transport";
import type { IActionTransportDef_Ws, ITransportPendingRequest } from "./Transport.types";

export class TransportWebSocket extends Transport<IActionTransportDef_Ws> {
  private _pending = new Map<string, ITransportPendingRequest>();
  // private _onMessageListeners: ((raw: string) => void)[] = [];
  connected: boolean = false;

  constructor(def: IActionTransportDef_Ws) {
    super(def);
  }

  protected send(primed: NiceActionPrimed<any>): void {
    const wire = primed.toJsonObject();
  }

  private onMessage(raw: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (isActionResponseJsonObject(parsed)) {
      this._resolveResponse(parsed);
    }
  }

  disconnect(): void {
    for (const [, pending] of this._pending) {
      clearTimeout(pending.timer);
      pending.reject(err_nice_connect.fromId(EErrId_NiceConnect.disconnected));
    }
    this._pending.clear();
  }

  private _resolveResponse(wire: TNiceActionResponse_JsonObject): void {
    const pending = this._pending.get(wire.cuid);
    if (pending == null) return;
    clearTimeout(pending.timer);
    this._pending.delete(wire.cuid);
    try {
      pending.resolve(pending.primed.coreAction.actionDomain.hydrateResponse(wire));
    } catch (e) {
      pending.reject(castNiceError(e));
    }
  }
}
