import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";
import { EErrId_NiceConnect, err_nice_connect } from "../err_nice_connect";
import { EErrId_NiceTransport, err_nice_transport } from "./err_nice_transport";
import type { ITransportPendingRequest, TActionTransportDef } from "./Transport.types";

interface IPendingWsRequest {
  resolve: (response: NiceActionResponse<any>) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
  primed: NiceActionPrimed<any>;
}

export abstract class Transport<DEF extends TActionTransportDef> {
  readonly type: DEF["type"];
  readonly requestResolvers = new Map<string, ITransportPendingRequest>();

  constructor(readonly def: DEF) {
    this.type = def.type;
  }

  protected abstract send(primed: NiceActionPrimed<any>): void;

  protected respond(response: NiceActionResponse<any>): void {
    const resolver = this.requestResolvers.get(response.primed.coreAction.cuid);
    if (resolver) {
      resolver.resolve(response);
      this.requestResolvers.delete(response.cuid);
    }
  }

  makeRequest(
    primed: NiceActionPrimed<any>,
    connectionDefaultTimeout: number,
  ): Promise<NiceActionResponse<any>> {
    const timeout = this.def.timeout ?? connectionDefaultTimeout;

    return new Promise((resolve, reject) => {
      this.requestResolvers.set(primed.cuid, {
        resolve,
        reject,
        timer: setTimeout(() => {
          this.requestResolvers.delete(primed.cuid);
          reject(err_nice_transport.fromId(EErrId_NiceTransport.transport_timeout, { timeout }));
        }, timeout),
        primed,
      });

      this.send(primed);
    });
  }
}
