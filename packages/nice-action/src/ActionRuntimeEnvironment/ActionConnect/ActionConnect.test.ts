import { describe, expect, it } from "vitest";
import { test_makeActionData } from "#test/helpers/action";
import { makeMockWs } from "#test/helpers/transport";
import { ActionConnect } from "./ActionConnect";
import { ConnectionConfig } from "./ConnectionConfig/ConnectionConfig";
import { ETransportType } from "./Transport/Transport.types";

describe("ActionConnect", () => {
  it("Should have a good interface", () => {
    const ws = makeMockWs();
    const { test_dom_user, test_dom_edit_doc, test_dom_push_doc } = test_makeActionData();

    const actionConnect = new ActionConnect([
      new ConnectionConfig({
        transports: [
          {
            type: ETransportType.ws,
            createWebSocket: () => Promise.resolve({ ws: ws as unknown as WebSocket }),
          },
        ],
      }),
    ])
      .routeDomain(test_dom_user)
      .routeDomain(test_dom_edit_doc)
      .incomingRequestDomain(test_dom_push_doc);

    expect(actionConnect).toBeInstanceOf(ActionConnect);
  });
});
