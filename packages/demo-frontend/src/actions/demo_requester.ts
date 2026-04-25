import { ActionHandler } from "@nice-code/action";
import { act_domain_demo } from "demo-shared";
import { BACKEND_BASE_URL } from "../frontend_env";

export const demo_requester = new ActionHandler().forDomain(act_domain_demo, {
  execution: async (primed) => {
    const res = await fetch(`${BACKEND_BASE_URL}/resolve_action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: primed.toJsonString(),
    });
    return res.json();
  },
});
