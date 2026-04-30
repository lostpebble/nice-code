import type {
  INiceActionPrimed_JsonObject,
  MaybePromise,
  TOnResolveIncomingRequest,
} from "../../..";
import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";
import { EErrId_NiceTransport, err_nice_transport } from "./err_nice_transport";
import {
  type ITransportPendingRequest,
  type TActionTransportDef,
  type TTransportStatusInfo,
} from "./Transport.types";

let transportOrd = 0;

export abstract class Transport<DEF extends TActionTransportDef> {
  readonly transportOrd = transportOrd++;
  readonly type: DEF["type"];
  readonly requestResolvers = new Map<string, ITransportPendingRequest>();
  protected abstract _status: TTransportStatusInfo;
  protected _filterUsage?: (
    primed: NiceActionPrimed<any> | NiceActionResponse<any>,
  ) => MaybePromise<boolean>;
  protected _onResolveIncomingPrimed?: (
    primed: INiceActionPrimed_JsonObject<any>,
    preferredTransport: Transport<any>,
  ) => void;

  constructor(
    readonly def: DEF,
    onResolveIncomingPrimed?: TOnResolveIncomingRequest,
  ) {
    this.type = def.type;
    this._filterUsage = def.filterUsage;
    this._onResolveIncomingPrimed = onResolveIncomingPrimed;
  }

  get status(): TTransportStatusInfo {
    return this._status;
  }

  filterUsage(primed: NiceActionPrimed<any> | NiceActionResponse<any>): MaybePromise<boolean> {
    if (this._filterUsage == null) {
      return true;
    }

    return this._filterUsage(primed);
  }

  checkAndPrepare(): TTransportStatusInfo {
    return this._status;
  }

  protected abstract send(action: NiceActionPrimed<any> | NiceActionResponse<any>): Promise<void>;
  abstract disconnect(): void;

  protected resolveIncomingResponse(response: NiceActionResponse<any>): void {
    const resolver = this.requestResolvers.get(response.cuid);
    if (resolver) {
      resolver.resolve(response);
      clearTimeout(resolver.timer);
      this.requestResolvers.delete(response.cuid);
    }
  }

  protected resolveIncomingPrimed(primed: INiceActionPrimed_JsonObject<any>): void {
    if (this._onResolveIncomingPrimed) {
      this._onResolveIncomingPrimed(primed, this);
    } else {
      console.warn(
        `Received incoming primed action JSON for ID "${primed.id}" on Transport [${this.type}] but no incoming resolver registered to handle it.`,
      );
    }
  }

  async sendResponse(response: NiceActionResponse<any>): Promise<void> {
    await this.send(response);
  }

  makeRequest(
    primed: NiceActionPrimed<any>,
    connectionDefaultTimeout: number,
  ): Promise<NiceActionResponse<any>> {
    const timeout = this.def.timeout ?? connectionDefaultTimeout;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requestResolvers.delete(primed.cuid);
        reject(err_nice_transport.fromId(EErrId_NiceTransport.timeout, { timeout }));
      }, timeout);

      this.requestResolvers.set(primed.cuid, {
        type: this.type,
        resolve,
        reject,
        timer,
        primed,
      });

      this.send(primed).catch((err) => {
        this.requestResolvers.delete(primed.cuid);
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
