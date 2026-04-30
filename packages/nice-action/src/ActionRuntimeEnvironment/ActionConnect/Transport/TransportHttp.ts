import { castNiceError } from "@nice-code/error";
import { EActionState } from "../../../NiceAction/NiceAction.enums";
import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";
import { isActionResponseJsonObject } from "../../../utils/isActionResponseJsonObject";
import { EErrId_NiceTransport, err_nice_transport } from "./err_nice_transport";
import { Transport } from "./Transport";
import {
  ETransportStatus,
  type IActionTransportDef_Http,
  type TTransportStatusInfo,
} from "./Transport.types";

export class TransportHttp extends Transport<IActionTransportDef_Http> {
  readonly abortControllers = new Map<string, AbortController>();
  protected _status: TTransportStatusInfo = {
    status: ETransportStatus.ready,
  };

  async send(action: NiceActionPrimed<any> | NiceActionResponse<any>): Promise<void> {
    const wire = action.toJsonObject();
    const ac = new AbortController();
    this.abortControllers.set(action.cuid, ac);

    try {
      const res = await fetch(this.def.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wire),
        signal: ac.signal,
      });

      if (!res.ok) {
        if (action.type === EActionState.primed) {
          try {
            const jsonData = await res.json();

            if (isActionResponseJsonObject(jsonData)) {
              this.resolveIncomingResponse(
                action.coreAction.actionDomain.hydrateResponse(jsonData),
              );
            } else {
              this.resolveIncomingResponse(action.errorResponse(castNiceError(jsonData)));
            }
          } catch (e: any) {
            throw err_nice_transport
              .fromId(EErrId_NiceTransport.send_failed, {
                actionState: action.type,
                actionId: action.id,
                httpStatusCode: res.status,
                message: e.message,
              })
              .withOriginError(e);
          }
        } else {
          let text: string | undefined;
          try {
            text = await res.text();
          } catch (e) {
            console.warn(
              `Failed to read error response body for failed HTTP request in TransportHttp:`,
              e,
            );
          }

          throw err_nice_transport.fromId(EErrId_NiceTransport.send_failed, {
            actionState: action.type,
            actionId: action.id,
            httpStatusCode: res.status,
            message: text ?? `HTTP error with status ${res.status}`,
          });
        }
      }

      if (action.type === EActionState.primed) {
        const json: unknown = await res.json();

        if (!isActionResponseJsonObject(json)) {
          throw err_nice_transport.fromId(EErrId_NiceTransport.invalid_action_response, {
            actionId: action.id,
          });
        }

        this.resolveIncomingResponse(action.coreAction.actionDomain.hydrateResponse(json));
      }
    } finally {
      this.abortControllers.delete(action.cuid);
    }
  }

  disconnect(): void {
    for (const [, ac] of this.abortControllers) {
      ac.abort();
    }
    this.abortControllers.clear();
  }
}
