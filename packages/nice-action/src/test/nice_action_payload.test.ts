import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { action } from "../NiceAction/ActionSchema/action";
import { createActionDomain } from "../NiceAction/createActionDomain";

const createTestActionDomain = () =>
  createActionDomain({
    domain: "test_domain",
    schema: {
      send_message: action()
        .input({ schema: v.object({ message: v.string(), channel: v.string() }) })
        .output({
          schema: v.object({
            lastFiveMessages: v.array(v.string()),
          }),
        }),
    },
  });

describe("Nice Action as an API Payload", () => {
  it("Should be serializable to JSON and deserializable back to the same action definition", () => {
    const actionDomain = createTestActionDomain();
    const sendMessageActionPayload = actionDomain
      .primeAction("send_message", {
        channel: "test",
        message: "Hello",
      })
      .toJsonObject();

    expect(sendMessageActionPayload).toEqual({
      allDomains: ["test_domain"],
      domain: "test_domain",
      id: "send_message",
      input: {
        channel: "test",
        message: "Hello",
      },
    });

    const action = actionDomain.hydrateAction(sendMessageActionPayload);
  });
});
