import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";
import { Transport } from "./Transport";
import {
  type IActionTransportDef_Custom,
  type ICustomActionTransport,
  type TOnResolveIncomingRequest,
  type TTransportStatusInfo,
} from "./Transport.types";

export class TransportCustom extends Transport<IActionTransportDef_Custom> {
  readonly abortControllers = new Map<string, AbortController>();
  protected _status: TTransportStatusInfo;
  private _customTransport: ICustomActionTransport;

  constructor(
    def: IActionTransportDef_Custom,
    onResolveIncomingPrimed?: TOnResolveIncomingRequest,
  ) {
    super(def, onResolveIncomingPrimed);
    this._status = def.initialStatus;
    this._customTransport = def.createTransport();
  }

  checkAndPrepare(): TTransportStatusInfo {
    this._status = this._customTransport.checkAndPrepare();
    return this._status;
  }

  async send(action: NiceActionPrimed<any> | NiceActionResponse<any>): Promise<void> {
    await this._customTransport.handleAction(action, (response) =>
      this.resolveIncomingResponse(response),
    );
  }

  disconnect(): void {
    this._customTransport.onDisconnect();
  }
}
