import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import { Transport } from "./Transport";
import type { IActionTransportDef_Ws } from "./Transport.types";

export class TransportWebSocket extends Transport<IActionTransportDef_Ws> {
  connected: boolean = false;

  constructor(def: IActionTransportDef_Ws) {
    super(def);
  }

  protected send(primed: NiceActionPrimed<any>): void {
    const wire = primed.toJsonObject();
  }

  disconnect(): void {}
}
