import * as v from "valibot";
import { createActionRootDomain } from "../../ActionDomain/helpers/createRootActionDomain";
import { action } from "../../ActionSchema/action";

let _n = 0;

export function test_makeActionData() {
  const n = ++_n;
  const root = createActionRootDomain({ domain: `test_root_${n}` });
  const test_dom_user = root.createChildDomain({
    domain: `test_dom_user_${n}`,
    actions: {
      sign_in: action()
        .input({ schema: v.object({ username: v.string(), password: v.string() }) })
        .output({ schema: v.object({ success: v.boolean() }) }),
    },
  });

  const test_dom_edit_doc = root.createChildDomain({
    domain: `test_dom_edit_doc_${n}`,
    actions: {
      edit_doc: action()
        .input({ schema: v.object({ docId: v.string(), newContent: v.string() }) })
        .output({ schema: v.object({ success: v.boolean() }) }),
      get_doc: action()
        .input({ schema: v.object({ docId: v.string() }) })
        .output({ schema: v.object({ content: v.string() }) }),
    },
  });

  const test_dom_push_doc = root.createChildDomain({
    domain: `test_dom_push_doc_${n}`,
    actions: {
      push_doc_update: action()
        .input({ schema: v.object({ docId: v.string(), updateContent: v.string() }) })
        .output({ schema: v.object({ updated: v.boolean() }) }),
    },
  });

  return { root, test_dom_user, test_dom_edit_doc, test_dom_push_doc };
}
