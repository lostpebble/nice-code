/* global React, CodeBlock, Callout, NICE_FLAT */

// Utility: section with heading anchor
function S({ id, children }) {
  return React.createElement(
    "h2",
    { id },
    children,
    React.createElement("a", { className: "anchor", href: "#" + id }, "#")
  );
}
function SS({ id, children }) {
  return React.createElement("h3", { id }, children);
}

// ======= PAGES =======

function P_Introduction() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" },
      "nice-code is two small TypeScript packages that treat errors and structured actions as first-class, typed, serializable values. ",
      React.createElement("strong", null, "No string messages. No lost context at the wire.")
    ),
    React.createElement(S, { id: "the-problem" }, "The problem"),
    React.createElement("p", null,
      "Plain JavaScript errors are stringly typed — you ", React.createElement("code", null, "throw"),
      " an ", React.createElement("code", null, "Error"), " with a message and hope the catcher figures out what happened. It falls apart at every boundary your code crosses:"
    ),
    React.createElement("ul", null,
      React.createElement("li", null, "No autocomplete on error kinds or their context fields"),
      React.createElement("li", null, React.createElement("code", null, "instanceof"), " breaks across serialization"),
      React.createElement("li", null, "HTTP, RPC, Durable Objects — each boundary flattens your error to ", React.createElement("code", null, "message: string")),
      React.createElement("li", null, "Typed request/response patterns require ceremony and brittle generics"),
    ),
    React.createElement(S, { id: "what-you-get" }, "What nice-code provides"),
    React.createElement(SS, { id: "error-package" }, "@nice-code/error"),
    React.createElement("p", null, "Declare your errors up front as a typed schema:"),
    React.createElement(CodeBlock, { tabs: [{ label: "errors.ts", lang: "typescript", code:
`[[kw|import]] { [[var|defineNiceError]], [[var|err]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|err_billing]] [[p|=]] [[fn|defineNiceError]]({
  [[prop|domain]]: [[str|"err_billing"]],
  [[prop|schema]]: {
    [[prop|payment_failed]]: [[fn|err]]<{ [[prop|reason]]: [[type|string]] }>({
      [[prop|message]]: ({ [[prop|reason]] }) [[p|=>]] [[str|\`Payment failed: \${reason}\`]],
      [[prop|httpStatusCode]]: [[num|402]],
      [[prop|context]]: { [[prop|required]]: [[kw|true]] },
    }),
    [[prop|card_expired]]: [[fn|err]]({
      [[prop|message]]: [[str|"Card has expired"]], [[prop|httpStatusCode]]: [[num|402]],
    }),
  },
});` }]}),
    React.createElement("p", null, "From that schema you get autocomplete on every id, type-safe context access, type guards that narrow, pattern matching, and safe serialization."),
    React.createElement(SS, { id: "action-package" }, "@nice-code/action"),
    React.createElement("p", null, "A typed action framework built on top of ", React.createElement("code", null, "@nice-code/error"), ". Define actions with input/output schemas, declare what they throw, register handlers and execute anywhere — locally or across a wire."),
    React.createElement(CodeBlock, { tabs: [{ label: "user-domain.ts", lang: "typescript", code:
`[[kw|import]] { [[var|createActionDomain]], [[var|action]] } [[kw|from]] [[str|"@nice-code/action"]];
[[kw|import]] * [[kw|as]] [[var|v]] [[kw|from]] [[str|"valibot"]];

[[kw|const]] [[var|user_domain]] [[p|=]] [[fn|createActionDomain]]({
  [[prop|domain]]: [[str|"user_domain"]],
  [[prop|actions]]: {
    [[prop|getUser]]: [[fn|action]]()
      [[p|.]][[fn|input]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|userId]]: [[var|v]][[p|.]][[fn|string]]() }) })
      [[p|.]][[fn|output]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|id]]: [[var|v]][[p|.]][[fn|string]](), [[prop|name]]: [[var|v]][[p|.]][[fn|string]]() }) })
      [[p|.]][[fn|throws]]([[var|err_user]], [[p|[]][[str|"not_found"]], [[str|"forbidden"]][[p|]]] [[kw|as const]]),
  },
});` }]}),
    React.createElement(S, { id: "packages" }, "Packages"),
    React.createElement("table", null,
      React.createElement("thead", null, React.createElement("tr", null,
        React.createElement("th", null, "Package"), React.createElement("th", null, "Install"), React.createElement("th", null, "Size (min+gz)")
      )),
      React.createElement("tbody", null,
        React.createElement("tr", null,
          React.createElement("td", null, React.createElement("code", null, "@nice-code/error")),
          React.createElement("td", null, React.createElement("code", null, "bun add @nice-code/error")),
          React.createElement("td", null, "2.1 kB")
        ),
        React.createElement("tr", null,
          React.createElement("td", null, React.createElement("code", null, "@nice-code/action")),
          React.createElement("td", null, React.createElement("code", null, "bun add @nice-code/action")),
          React.createElement("td", null, "3.4 kB")
        )
      )
    )
  );
}

function P_QuickStart() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Five minutes each, end to end — install, define a domain, throw, catch, serialize."),
    React.createElement(S, { id: "install" }, "Install"),
    React.createElement(CodeBlock, { tabs: [
      { label: "bun", lang: "shell", code: `[[prop|$]] bun add @nice-code/error
[[prop|$]] bun add @nice-code/action [[cm|# also installs @nice-code/error]]` },
      { label: "pnpm", lang: "shell", code: `[[prop|$]] pnpm add @nice-code/error
[[prop|$]] pnpm add @nice-code/action` },
      { label: "npm", lang: "shell", code: `[[prop|$]] npm install @nice-code/error
[[prop|$]] npm install @nice-code/action` },
      { label: "yarn", lang: "shell", code: `[[prop|$]] yarn add @nice-code/error
[[prop|$]] yarn add @nice-code/action` },
    ], term: true }),
    React.createElement(S, { id: "error-in-5" }, "@nice-code/error in 5 minutes"),
    React.createElement(SS, { id: "define-domain" }, "1. Define an error domain"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|defineNiceError]], [[var|err]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|err_billing]] [[p|=]] [[fn|defineNiceError]]({
  [[prop|domain]]: [[str|"err_billing"]],
  [[prop|schema]]: {
    [[prop|payment_failed]]: [[fn|err]]<{ [[prop|reason]]: [[type|string]] }>({
      [[prop|message]]: ({ [[prop|reason]] }) [[p|=>]] [[str|\`Payment failed: \${reason}\`]],
      [[prop|httpStatusCode]]: [[num|402]],
      [[prop|context]]: { [[prop|required]]: [[kw|true]] },
    }),
    [[prop|card_expired]]: [[fn|err]]({ [[prop|message]]: [[str|"Card has expired"]], [[prop|httpStatusCode]]: [[num|402]] }),
  },
});` }),
    React.createElement(SS, { id: "throw-error" }, "2. Create and throw"),
    React.createElement(CodeBlock, { code: `[[kw|throw]] [[var|err_billing]][[p|.]][[fn|fromId]]([[str|"payment_failed"]], { [[prop|reason]]: [[str|"card declined"]] });` }),
    React.createElement(SS, { id: "catch-narrow" }, "3. Catch and narrow"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|castNiceError]], [[var|forDomain]], [[var|forIds]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|try]] {
  [[kw|await]] [[fn|processPayment]]();
} [[kw|catch]] ([[var|e]]) {
  [[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|e]]);

  [[var|error]][[p|.]][[fn|handleWith]]([
    [[fn|forIds]]([[var|err_billing]], [[p|[]][[str|"payment_failed"]][[p|]]], ([[var|h]]) [[p|=>]] {
      [[kw|const]] { [[prop|reason]] } [[p|=]] [[var|h]][[p|.]][[fn|getContext]]([[str|"payment_failed"]]);
      [[var|res]][[p|.]][[fn|status]]([[num|402]])[[p|.]][[fn|json]]({ [[prop|reason]] });
    }),
    [[fn|forDomain]]([[var|err_billing]], ([[var|h]]) [[p|=>]] [[var|res]][[p|.]][[fn|status]]([[var|h]][[p|.]][[prop|httpStatusCode]])[[p|.]][[fn|json]]({ [[prop|error]]: [[var|h]][[p|.]][[prop|message]] })),
  ]);
}` }),
    React.createElement(SS, { id: "across-boundary" }, "4. Serialize across a boundary"),
    React.createElement(CodeBlock, { tabs: [
      { label: "server.ts", code: `[[kw|return]] [[var|Response]][[p|.]][[fn|json]]([[var|error]][[p|.]][[fn|toJsonObject]](), { [[prop|status]]: [[var|error]][[p|.]][[prop|httpStatusCode]] });` },
      { label: "client.ts", code:
`[[kw|const]] [[var|body]] [[p|=]] [[kw|await]] [[var|res]][[p|.]][[fn|json]]();
[[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|body]]);
[[kw|if]] ([[var|err_billing]][[p|.]][[fn|isExact]]([[var|error]])) {
  [[var|error]][[p|.]][[fn|hasId]]([[str|"payment_failed"]]); [[cm|// true — type guard works on hydrated]]
}` },
    ]}),
    React.createElement(Callout, { label: "Tip" },
      "Every nice-code error is a ", React.createElement("code", null, "NiceError"), " instance. ",
      React.createElement("code", null, "castNiceError"), " handles strings, ", React.createElement("code", null, "Error"), " objects, JSON, ", React.createElement("code", null, "null"), " — always returns something narrowable."
    ),
    React.createElement(S, { id: "action-in-5" }, "@nice-code/action in 5 minutes"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|createActionDomain]], [[var|action]] } [[kw|from]] [[str|"@nice-code/action"]];
[[kw|import]] * [[kw|as]] [[var|v]] [[kw|from]] [[str|"valibot"]];

[[kw|const]] [[var|user_domain]] [[p|=]] [[fn|createActionDomain]]({
  [[prop|domain]]: [[str|"user_domain"]],
  [[prop|actions]]: {
    [[prop|getUser]]: [[fn|action]]()
      [[p|.]][[fn|input]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|userId]]: [[var|v]][[p|.]][[fn|string]]() }) })
      [[p|.]][[fn|output]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|id]]: [[var|v]][[p|.]][[fn|string]](), [[prop|name]]: [[var|v]][[p|.]][[fn|string]]() }) }),
    [[prop|deleteUser]]: [[fn|action]]()[[p|.]][[fn|input]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|userId]]: [[var|v]][[p|.]][[fn|string]]() }) }),
  },
});

[[cm|// Register a resolver — local execution, no requester needed]]
[[var|user_domain]][[p|.]][[fn|registerResponder]](
  [[fn|createDomainResolver]]([[var|user_domain]])
    [[p|.]][[fn|resolveAction]]([[str|"getUser"]], ({ [[prop|userId]] }) [[p|=>]] [[var|db]][[p|.]][[fn|findUser]]([[var|userId]]))
    [[p|.]][[fn|resolveAction]]([[str|"deleteUser"]], ({ [[prop|userId]] }) [[p|=>]] [[var|db]][[p|.]][[fn|deleteUser]]([[var|userId]])),
);

[[kw|const]] [[var|user]] [[p|=]] [[kw|await]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|execute]]({ [[prop|userId]]: [[str|"u1"]] });` })
  );
}

function P_Install() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Works with Bun (recommended), pnpm, npm, Yarn, and Deno. No codegen, no build step, no peer dependencies beyond valibot (actions only)."),
    React.createElement(S, { id: "package-manager" }, "Package manager"),
    React.createElement(CodeBlock, { tabs: [
      { label: "bun", code: `[[prop|$]] bun add @nice-code/error @nice-code/action` },
      { label: "pnpm", code: `[[prop|$]] pnpm add @nice-code/error @nice-code/action` },
      { label: "npm", code: `[[prop|$]] npm install @nice-code/error @nice-code/action` },
      { label: "yarn", code: `[[prop|$]] yarn add @nice-code/error @nice-code/action` },
      { label: "deno", code: `[[kw|import]] { [[var|defineNiceError]] } [[kw|from]] [[str|"npm:@nice-code/error"]];` },
    ], term: true }),
    React.createElement(S, { id: "typescript-config" }, "TypeScript"),
    React.createElement("p", null, "nice-code requires TypeScript 5.4+ for ", React.createElement("code", null, "const"), " type parameters. Strict mode is recommended — most guarantees only hold with ", React.createElement("code", null, "strictNullChecks"), " on."),
    React.createElement(CodeBlock, { tabs: [{ label: "tsconfig.json", lang: "json", code:
`{
  [[str|"compilerOptions"]]: {
    [[str|"strict"]]: [[kw|true]],
    [[str|"target"]]: [[str|"ES2022"]],
    [[str|"module"]]: [[str|"ESNext"]],
    [[str|"moduleResolution"]]: [[str|"Bundler"]]
  }
}` }]}),
    React.createElement(S, { id: "peer-deps" }, "Peer dependencies"),
    React.createElement("ul", null,
      React.createElement("li", null, React.createElement("code", null, "@nice-code/error"), " — none"),
      React.createElement("li", null, React.createElement("code", null, "@nice-code/action"), " — ", React.createElement("code", null, "valibot ^0.40.0"), " for schema validation"),
    )
  );
}

function P_Philosophy() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Why nice-code looks the way it does — three opinions about errors and actions."),
    React.createElement(S, { id: "opinion-1" }, "1. Errors are data, not exceptions"),
    React.createElement("p", null, "A thrown ", React.createElement("code", null, "Error"), " is a single-hop signal. By the time it crosses a fetch or a worker boundary, it's a string — and a string can't be caught, matched, or narrowed. nice-code errors carry everything needed to reconstruct them on the far side: domain, id set, context, origin error, http status."),
    React.createElement(S, { id: "opinion-2" }, "2. The catch block is a responsibility, not a habit"),
    React.createElement("p", null, "Most codebases catch everything and log it. nice-code makes it easy to route errors declaratively — ", React.createElement("code", null, "handleWith"), " forces you to think about who's responsible for what, and the compiler tells you when you've forgotten an id."),
    React.createElement(S, { id: "opinion-3" }, "3. Actions should survive travel"),
    React.createElement("p", null, "A typed function call is nice. A typed function call that can be serialized, queued, retried and dispatched in a worker is nicer. Actions are a small step beyond function-as-data, and they compose with errors for free."),
    React.createElement(Callout, { label: "Prior art" },
      "If you've used ", React.createElement("code", null, "neverthrow"), ", ", React.createElement("code", null, "effect"), ", or tRPC — nice-code sits between them. Smaller than Effect, opinionated about errors in a way tRPC isn't, and with no transport baked in."
    )
  );
}

// ---- @nice-code/error pages ----

function P_ErrDomains() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "An error domain is a named collection of error definitions. Each definition describes a single kind of error — its message, HTTP status code, and optional typed context payload."),
    React.createElement(S, { id: "defining" }, "Defining a domain"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|defineNiceError]], [[var|err]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|err_billing]] [[p|=]] [[fn|defineNiceError]]({
  [[prop|domain]]: [[str|"err_billing"]],
  [[prop|schema]]: {
    [[prop|payment_failed]]: [[fn|err]]<{ [[prop|reason]]: [[type|string]] }>({
      [[prop|message]]: ({ [[prop|reason]] }) [[p|=>]] [[str|\`Payment failed: \${reason}\`]],
      [[prop|httpStatusCode]]: [[num|402]],
      [[prop|context]]: { [[prop|required]]: [[kw|true]] },
    }),
    [[prop|card_expired]]: [[fn|err]]({ [[prop|message]]: [[str|"Card has expired"]], [[prop|httpStatusCode]]: [[num|402]] }),
    [[prop|insufficient_funds]]: [[fn|err]]({ [[prop|message]]: [[str|"Insufficient funds"]], [[prop|httpStatusCode]]: [[num|402]] }),
  },
});` }),
    React.createElement("p", null, "The ", React.createElement("code", null, "domain"), " string is a stable identifier used for serialization and ancestry checks. It should be unique across your application."),
    React.createElement(S, { id: "err-builder" }, "The err() builder"),
    React.createElement(CodeBlock, { code:
`[[cm|// No context]]
[[fn|err]]({ [[prop|message]]: [[str|"Something went wrong"]], [[prop|httpStatusCode]]: [[num|500]] })

[[cm|// Optional context]]
[[fn|err]]<{ [[prop|userId]]: [[type|string]] }>({
  [[prop|message]]: ({ [[prop|userId]] }) [[p|=>]] [[str|\`User \${userId} not found\`]],
  [[prop|httpStatusCode]]: [[num|404]],
})

[[cm|// Required context — TypeScript enforces that context is passed at creation]]
[[fn|err]]<{ [[prop|field]]: [[type|string]] }>({
  [[prop|message]]: ({ [[prop|field]] }) [[p|=>]] [[str|\`Invalid value for: \${field}\`]],
  [[prop|httpStatusCode]]: [[num|422]],
  [[prop|context]]: { [[prop|required]]: [[kw|true]] },
})` }),
    React.createElement(S, { id: "creating" }, "Creating errors"),
    React.createElement(CodeBlock, { code:
`[[cm|// Single ID, no context]]
[[kw|const]] [[var|error]] [[p|=]] [[var|err_billing]][[p|.]][[fn|fromId]]([[str|"card_expired"]]);

[[cm|// Single ID with context]]
[[kw|const]] [[var|error]] [[p|=]] [[var|err_billing]][[p|.]][[fn|fromId]]([[str|"payment_failed"]], { [[prop|reason]]: [[str|"card declined"]] });

[[var|error]][[p|.]][[prop|message]];        [[cm|// "Payment failed: card declined"]]
[[var|error]][[p|.]][[prop|httpStatusCode]]; [[cm|// 402]]
[[var|error]][[p|.]][[prop|domain]];         [[cm|// "err_billing"]]` }),
    React.createElement(S, { id: "origin" }, "Attaching an origin error"),
    React.createElement("p", null, "Preserve the underlying cause alongside the typed error:"),
    React.createElement(CodeBlock, { code:
`[[kw|try]] {
  [[kw|await]] [[var|stripe]][[p|.]][[fn|charge]]([[var|amount]]);
} [[kw|catch]] ([[var|e]]) {
  [[kw|throw]] [[var|err_billing]]
    [[p|.]][[fn|fromId]]([[str|"payment_failed"]], { [[prop|reason]]: [[str|"gateway error"]] })
    [[p|.]][[fn|withOriginError]]([[var|e]]);
}` })
  );
}

function P_ErrMulti() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "A nice-code error can carry more than one id at a time — useful when multiple conditions are true simultaneously (a card that is both expired AND has insufficient funds)."),
    React.createElement(S, { id: "from-context" }, "fromContext()"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|error]] [[p|=]] [[var|err_billing]][[p|.]][[fn|fromContext]]({
  [[prop|payment_failed]]: { [[prop|reason]]: [[str|"retry limit"]] },
  [[prop|card_expired]]: [[kw|undefined]],
});

[[var|error]][[p|.]][[fn|getIds]]();    [[cm|// ["payment_failed", "card_expired"]]]
[[var|error]][[p|.]][[prop|hasMultiple]]; [[cm|// true]]` }),
    React.createElement(S, { id: "adding" }, "Adding ids to an existing error"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|error2]] [[p|=]] [[var|err_billing]]
  [[p|.]][[fn|fromId]]([[str|"payment_failed"]], { [[prop|reason]]: [[str|"network timeout"]] })
  [[p|.]][[fn|addId]]([[str|"card_expired"]]);` }),
    React.createElement(Callout, { label: "Immutable" }, React.createElement("code", null, ".addId()"), " and ", React.createElement("code", null, ".addContext()"), " return new errors — the original is never mutated.")
  );
}

function P_ErrHierarchy() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Domains form a tree. Use child domains for feature-specific errors that share a root — then use ancestry checks to catch broad categories without enumerating ids."),
    React.createElement(S, { id: "child-domains" }, "Child domains"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|err_app]] [[p|=]] [[fn|defineNiceError]]({ [[prop|domain]]: [[str|"err_app"]], [[prop|schema]]: {} });

[[kw|const]] [[var|err_auth]] [[p|=]] [[var|err_app]][[p|.]][[fn|createChildDomain]]({
  [[prop|domain]]: [[str|"err_auth"]],
  [[prop|schema]]: { [[prop|unauthorized]]: [[fn|err]]({ [[prop|message]]: [[str|"Unauthorized"]], [[prop|httpStatusCode]]: [[num|401]] }) },
});

[[var|err_app]][[p|.]][[fn|isParentOf]]([[var|err_auth]]);      [[cm|// true]]
[[var|err_auth]][[p|.]][[fn|isExact]]([[var|error]]);           [[cm|// exact domain match]]
[[var|err_app]][[p|.]][[fn|isThisOrChild]]([[var|error]]);      [[cm|// ancestry check]]` })
  );
}

function P_ErrSerialization() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "The whole point of nice-code errors is that they survive the network. Serialize on one side, reconstruct with full types on the other."),
    React.createElement(S, { id: "send" }, "Server — serialize and send"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|error]] [[p|=]] [[var|err_order]][[p|.]][[fn|fromId]]([[str|"out_of_stock"]], { [[var|sku]] });
[[kw|return]] [[var|Response]][[p|.]][[fn|json]]([[var|error]][[p|.]][[fn|toJsonObject]](), { [[prop|status]]: [[var|error]][[p|.]][[prop|httpStatusCode]] });` }),
    React.createElement(S, { id: "receive" }, "Client — cast and narrow"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|castNiceError]], [[var|castAndHydrate]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|body]] [[p|=]] [[kw|await]] [[var|res]][[p|.]][[fn|json]]();
[[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|body]]);

[[kw|if]] ([[var|err_order]][[p|.]][[fn|isExact]]([[var|error]])) {
  [[var|error]][[p|.]][[fn|getContext]]([[str|"out_of_stock"]])[[p|.]][[prop|sku]]; [[cm|// string ✓]]
}

[[cm|// One-step cast + domain check]]
[[kw|const]] [[var|error]] [[p|=]] [[fn|castAndHydrate]]([[var|caughtValue]], [[var|err_order]]);` }),
    React.createElement(Callout, { label: "Safe by default" }, React.createElement("code", null, "castNiceError"), " never throws. It accepts any value — string, Error, null, JSON object, another NiceError — and returns something you can narrow.")
  );
}

function P_ErrHandling() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "handleWith dispatches an error to the first matching case. matchFirst does the same for pattern-matching by id."),
    React.createElement(S, { id: "handle-with" }, "handleWith"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|forDomain]], [[var|forIds]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|handled]] [[p|=]] [[var|error]][[p|.]][[fn|handleWith]]([
  [[fn|forIds]]([[var|err_billing]], [[p|[]][[str|"payment_failed"]][[p|]]], ([[var|h]]) [[p|=>]] {
    [[kw|const]] { [[prop|reason]] } [[p|=]] [[var|h]][[p|.]][[fn|getContext]]([[str|"payment_failed"]]);
    [[var|res]][[p|.]][[fn|status]]([[num|402]])[[p|.]][[fn|json]]({ [[prop|reason]] });
  }),
  [[fn|forDomain]]([[var|err_billing]], ([[var|h]]) [[p|=>]] [[var|res]][[p|.]][[fn|status]]([[var|h]][[p|.]][[prop|httpStatusCode]])[[p|.]][[fn|json]]({ [[prop|error]]: [[var|h]][[p|.]][[prop|message]] })),
  [[fn|forDomain]]([[var|err_auth]], ([[var|h]]) [[p|=>]] [[var|res]][[p|.]][[fn|status]]([[num|401]])[[p|.]][[fn|json]]({ [[prop|error]]: [[str|"Unauthorized"]] })),
]);

[[kw|if]] ([[p|!]][[var|handled]]) [[fn|next]]([[var|error]]); [[cm|// nothing matched — pass along]]` }),
    React.createElement(S, { id: "match-first" }, "matchFirst"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|matchFirst]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|message]] [[p|=]] [[fn|matchFirst]]([[var|error]], {
  [[prop|payment_failed]]: ({ [[prop|reason]] }) [[p|=>]] [[str|\`Payment failed: \${reason}\`]],
  [[prop|card_expired]]:   ()           [[p|=>]] [[str|"Your card has expired"]],
  [[prop|_]]:              ()           [[p|=>]] [[str|"A billing error occurred"]],
});` })
  );
}

function P_ErrTypeGuards() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Type guards are how nice-code proves to TypeScript which ids are active on an error."),
    React.createElement(S, { id: "hasId" }, "hasId"),
    React.createElement(CodeBlock, { code:
`[[kw|if]] ([[var|error]][[p|.]][[fn|hasId]]([[str|"payment_failed"]])) {
  [[var|error]][[p|.]][[fn|getContext]]([[str|"payment_failed"]])[[p|.]][[prop|reason]]; [[cm|// string — TS knows this id is active]]
}` }),
    React.createElement(S, { id: "hasOneOfIds" }, "hasOneOfIds"),
    React.createElement(CodeBlock, { code:
`[[kw|if]] ([[var|error]][[p|.]][[fn|hasOneOfIds]]([[p|[]][[str|"card_expired"]], [[str|"insufficient_funds"]][[p|]]])) {
  [[cm|// narrowed to those two IDs]]
}` }),
    React.createElement(S, { id: "domain-guards" }, "Domain guards"),
    React.createElement(CodeBlock, { code:
`[[var|err_billing]][[p|.]][[fn|isExact]]([[var|error]]);       [[cm|// exact domain]]
[[var|err_app]][[p|.]][[fn|isThisOrChild]]([[var|error]]);      [[cm|// ancestry-aware]]
[[fn|isNiceErrorObject]]([[var|jsonBlob]]);  [[cm|// type guard for serialized shape]]` })
  );
}

function P_ErrPacking() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Some runtimes (Cloudflare Durable Objects, certain RPC layers) only propagate ", React.createElement("code", null, "error.message"), ". Packing embeds the full serialized error inside ", React.createElement("code", null, "message"), " so it survives."),
    React.createElement(S, { id: "pack" }, "Packing on throw"),
    React.createElement(CodeBlock, { code:
`[[kw|throw]] [[var|error]][[p|.]][[fn|pack]]();               [[cm|// msg_pack (default)]]
[[kw|throw]] [[var|error]][[p|.]][[fn|pack]]([[str|"cause_pack"]]);   [[cm|// packs into error.cause instead]]` }),
    React.createElement(S, { id: "unpack" }, "Unpacking on catch"),
    React.createElement("p", null, React.createElement("code", null, "castNiceError"), " unpacks automatically — you don't have to think about it."),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|caught]]); [[cm|// unpacks if packed]]` }),
    React.createElement(S, { id: "defaults" }, "Domain-level defaults"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|EErrorPackType]] } [[kw|from]] [[str|"@nice-code/error"]];
[[var|err_durable]][[p|.]][[fn|packAs]]([[var|EErrorPackType]][[p|.]][[prop|msg_pack]]);` })
  );
}

// ---- @nice-code/action pages ----

function P_ActDomains() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Actions are typed request/response pairs. Define their input and output schemas, declare the errors they throw, and you've got a transport-agnostic RPC surface."),
    React.createElement(S, { id: "define" }, "Defining an action domain"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|createActionDomain]], [[var|action]] } [[kw|from]] [[str|"@nice-code/action"]];
[[kw|import]] * [[kw|as]] [[var|v]] [[kw|from]] [[str|"valibot"]];

[[kw|const]] [[var|user_domain]] [[p|=]] [[fn|createActionDomain]]({
  [[prop|domain]]: [[str|"user_domain"]],
  [[prop|actions]]: {
    [[prop|getUser]]: [[fn|action]]()
      [[p|.]][[fn|input]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|userId]]: [[var|v]][[p|.]][[fn|string]]() }) })
      [[p|.]][[fn|output]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|id]]: [[var|v]][[p|.]][[fn|string]](), [[prop|name]]: [[var|v]][[p|.]][[fn|string]]() }) })
      [[p|.]][[fn|throws]]([[var|err_user]], [[p|[]][[str|"not_found"]], [[str|"forbidden"]][[p|]]] [[kw|as const]]),

    [[prop|deleteUser]]: [[fn|action]]()
      [[p|.]][[fn|input]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|userId]]: [[var|v]][[p|.]][[fn|string]]() }) })
      [[p|.]][[fn|throws]]([[var|err_user]]),
  },
});` }),
    React.createElement(S, { id: "child" }, "Child domains"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|root]] [[p|=]] [[fn|createActionDomain]]({ [[prop|domain]]: [[str|"root"]], [[prop|actions]]: { [[prop|ping]]: [[fn|action]]() } });
[[kw|const]] [[var|child]] [[p|=]] [[var|root]][[p|.]][[fn|createChildDomain]]({ [[prop|domain]]: [[str|"child.users"]], [[prop|actions]]: { [[p|...]] } });` })
  );
}

function P_ActExecuting() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Once an action domain has a handler registered, call ", React.createElement("code", null, ".execute()"), " anywhere in your app — the handler runs, returns the output, done."),
    React.createElement(S, { id: "execute" }, "execute() and executeSafe()"),
    React.createElement(CodeBlock, { code:
`[[cm|// Throws on error]]
[[kw|const]] [[var|user]] [[p|=]] [[kw|await]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|execute]]({ [[prop|userId]]: [[str|"u1"]] });

[[cm|// Safe — returns discriminated { ok, output } | { ok: false, error }]]
[[kw|const]] [[var|result]] [[p|=]] [[kw|await]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|executeSafe]]({ [[prop|userId]]: [[str|"u1"]] });
[[kw|if]] ([[var|result]][[p|.]][[prop|ok]]) {
  [[var|console]][[p|.]][[fn|log]]([[var|result]][[p|.]][[prop|output]][[p|.]][[prop|name]]);
} [[kw|else]] {
  [[var|result]][[p|.]][[prop|error]][[p|.]][[fn|handleWith]]([
    [[fn|forDomain]]([[var|err_user]], ([[var|h]]) [[p|=>]] [[var|console]][[p|.]][[fn|error]]([[var|h]][[p|.]][[prop|message]])),
  ]);
}` }),
    React.createElement(S, { id: "priming" }, "Priming without execution"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|primed]] [[p|=]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|prime]]({ [[prop|userId]]: [[str|"u1"]] });

[[var|primed]][[p|.]][[fn|toJsonObject]](); [[cm|// ready for transport]]
[[kw|await]] [[var|primed]][[p|.]][[fn|execute]]();  [[cm|// or execute later]]` })
  );
}

function P_ActRequesters() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "A requester is the handler side of an action domain. Register once, call ", React.createElement("code", null, ".execute()"), " anywhere."),
    React.createElement(S, { id: "domain-handler" }, "forDomain"),
    React.createElement(CodeBlock, { code:
`[[var|user_domain]][[p|.]][[fn|setActionRequester]]()[[p|.]][[fn|forDomain]]([[var|user_domain]], ([[var|act]]) [[p|=>]] {
  [[kw|const]] [[var|getUser]] [[p|=]] [[var|user_domain]][[p|.]][[fn|matchAction]]([[var|act]], [[str|"getUser"]]);
  [[kw|if]] ([[var|getUser]]) [[kw|return]] [[var|db]][[p|.]][[fn|findUser]]([[var|getUser]][[p|.]][[prop|input]][[p|.]][[prop|userId]]);

  [[kw|const]] [[var|deleteUser]] [[p|=]] [[var|user_domain]][[p|.]][[fn|matchAction]]([[var|act]], [[str|"deleteUser"]]);
  [[kw|if]] ([[var|deleteUser]]) [[kw|return]] [[var|db]][[p|.]][[fn|deleteUser]]([[var|deleteUser]][[p|.]][[prop|input]][[p|.]][[prop|userId]]);
});` }),
    React.createElement(S, { id: "per-id" }, "forActionId"),
    React.createElement(CodeBlock, { code:
`[[var|user_domain]][[p|.]][[fn|setActionRequester]]()
  [[p|.]][[fn|forActionId]]([[var|user_domain]], [[str|"getUser"]], ([[var|act]]) [[p|=>]] [[var|db]][[p|.]][[fn|findUser]]([[var|act]][[p|.]][[prop|input]][[p|.]][[prop|userId]]))
  [[p|.]][[fn|forActionId]]([[var|user_domain]], [[str|"deleteUser"]], ([[var|act]]) [[p|=>]] [[var|db]][[p|.]][[fn|deleteUser]]([[var|act]][[p|.]][[prop|input]][[p|.]][[prop|userId]]));` })
  );
}

function P_ActResolvers() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "A resolver is a terser form of requester for local dispatch. Pair each action id with a function — that's it."),
    React.createElement(S, { id: "local" }, "createDomainResolver"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|createDomainResolver]] } [[kw|from]] [[str|"@nice-code/action"]];

[[var|user_domain]][[p|.]][[fn|registerResponder]](
  [[fn|createDomainResolver]]([[var|user_domain]])
    [[p|.]][[fn|resolveAction]]([[str|"getUser"]], ({ [[prop|userId]] }) [[p|=>]] [[var|db]][[p|.]][[fn|findUser]]([[var|userId]]))
    [[p|.]][[fn|resolveAction]]([[str|"deleteUser"]], ({ [[prop|userId]] }) [[p|=>]] [[var|db]][[p|.]][[fn|deleteUser]]([[var|userId]])),
);

[[kw|const]] [[var|user]] [[p|=]] [[kw|await]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|execute]]({ [[prop|userId]]: [[str|"u1"]] });` }),
    React.createElement(Callout, { label: "When to use" }, "Resolvers if the handler lives in the same process. Requesters if you need to do dispatch logic (logging, auth, context injection) around the handler.")
  );
}

function P_ActWire() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Actions serialize to plain JSON and reconstruct on the other side, with full input/output types intact."),
    React.createElement(S, { id: "prime" }, "Prime and serialize"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|primed]] [[p|=]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|prime]]({ [[prop|userId]]: [[str|"u1"]] });

[[kw|const]] [[var|wire]] [[p|=]] [[var|primed]][[p|.]][[fn|toJsonObject]]();   [[cm|// plain object]]
[[kw|const]] [[var|json]] [[p|=]] [[var|primed]][[p|.]][[fn|toJsonString]]();   [[cm|// JSON string]]` }),
    React.createElement(S, { id: "env" }, "Responder environments"),
    React.createElement(CodeBlock, { code:
`[[kw|import]] { [[var|createDomainResolver]], [[var|createResponderEnvironment]] } [[kw|from]] [[str|"@nice-code/action"]];

[[cm|// Server side — register resolvers in an environment]]
[[kw|const]] [[var|env]] [[p|=]] [[fn|createResponderEnvironment]]([
  [[fn|createDomainResolver]]([[var|user_domain]])
    [[p|.]][[fn|resolveAction]]([[str|"getUser"]], ({ [[prop|userId]] }) [[p|=>]] [[var|db]][[p|.]][[fn|findUser]]([[var|userId]])),
]);

[[cm|// Receive a primed action JSON object and dispatch it]]
[[kw|const]] [[var|wireResponse]] [[p|=]] [[kw|await]] [[var|env]][[p|.]][[fn|dispatch]]([[var|primedActionJson]]);

[[cm|// Client side — hydrate the response back]]
[[kw|const]] [[var|response]] [[p|=]] [[var|user_domain]][[p|.]][[fn|hydrateResponse]]([[var|wireResponse]]);
[[kw|if]] ([[var|response]][[p|.]][[prop|result]][[p|.]][[prop|ok]]) [[var|response]][[p|.]][[prop|result]][[p|.]][[prop|output]]; [[cm|// typed]]` }),
    React.createElement(S, { id: "serde" }, "Custom serialization"),
    React.createElement("p", null, "When input/output types aren't plain JSON (e.g. ", React.createElement("code", null, "Date"), "), attach serialize/deserialize hooks:"),
    React.createElement(CodeBlock, { code:
`[[prop|schedule]]: [[fn|action]]()[[p|.]][[fn|input]]({
  [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|at]]: [[var|v]][[p|.]][[fn|date]]() }),
  [[prop|serialization]]: {
    [[prop|serialize]]:   ({ [[prop|at]] }) [[p|=>]] ({ [[prop|iso]]: [[var|at]][[p|.]][[fn|toISOString]]() }),
    [[prop|deserialize]]: ([[var|s]]: { [[prop|iso]]: [[type|string]] }) [[p|=>]] ({ [[prop|at]]: [[kw|new]] [[fn|Date]]([[var|s]][[p|.]][[prop|iso]]) }),
  },
}),` })
  );
}

function P_ActErrors() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Actions hook into @nice-code/error via ", React.createElement("code", null, ".throws()"), ". Declared errors flow into ", React.createElement("code", null, "executeSafe"), " results and cross the wire untouched."),
    React.createElement(S, { id: "throws" }, "Declaring throws"),
    React.createElement(CodeBlock, { code:
`[[prop|getUser]]: [[fn|action]]()
  [[p|.]][[fn|input]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|userId]]: [[var|v]][[p|.]][[fn|string]]() }) })
  [[p|.]][[fn|output]]({ [[prop|schema]]: [[var|v]][[p|.]][[fn|object]]({ [[prop|id]]: [[var|v]][[p|.]][[fn|string]]() }) })
  [[p|.]][[fn|throws]]([[var|err_user]], [[p|[]][[str|"not_found"]], [[str|"forbidden"]][[p|]]] [[kw|as const]]),` }),
    React.createElement(S, { id: "safe-handling" }, "Handling errors safely"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|r]] [[p|=]] [[kw|await]] [[var|user_domain]][[p|.]][[fn|action]]([[str|"getUser"]])[[p|.]][[fn|executeSafe]]({ [[prop|userId]]: [[str|"u1"]] });
[[kw|if]] ([[p|!]][[var|r]][[p|.]][[prop|ok]]) {
  [[kw|if]] ([[var|r]][[p|.]][[prop|error]][[p|.]][[fn|hasId]]([[str|"not_found"]])) { [[cm|/* 404 path */]] }
}` })
  );
}

// ---- Recipes ----

function P_RecHTTP() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "The canonical setup: server throws a nice-code error, client receives JSON, narrows it, routes accordingly."),
    React.createElement(S, { id: "server" }, "Server (Hono, Elysia, Express, ...)"),
    React.createElement(CodeBlock, { code:
`[[var|app]][[p|.]][[fn|post]]([[str|"/order"]], [[kw|async]] ([[var|c]]) [[p|=>]] {
  [[kw|try]] {
    [[kw|return]] [[var|c]][[p|.]][[fn|json]]([[kw|await]] [[fn|placeOrder]]([[kw|await]] [[var|c]][[p|.]][[fn|req]][[p|.]][[fn|json]]()));
  } [[kw|catch]] ([[var|e]]) {
    [[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|e]]);
    [[kw|return]] [[var|c]][[p|.]][[fn|json]]([[var|error]][[p|.]][[fn|toJsonObject]](), [[var|error]][[p|.]][[prop|httpStatusCode]]);
  }
});` }),
    React.createElement(S, { id: "client" }, "Client"),
    React.createElement(CodeBlock, { code:
`[[kw|const]] [[var|res]] [[p|=]] [[kw|await]] [[fn|fetch]]([[str|"/order"]], { [[prop|method]]: [[str|"POST"]], [[prop|body]]: [[var|JSON]][[p|.]][[fn|stringify]]([[var|order]]) });
[[kw|if]] ([[p|!]][[var|res]][[p|.]][[prop|ok]]) {
  [[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[kw|await]] [[var|res]][[p|.]][[fn|json]]());
  [[kw|if]] ([[var|err_order]][[p|.]][[fn|isExact]]([[var|error]])) [[fn|showOrderError]]([[var|error]]);
}` })
  );
}

function P_RecDurable() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Durable Objects re-throw only the ", React.createElement("code", null, ".message"), " of errors across the stub boundary. Packing is how nice-code errors survive that crossing."),
    React.createElement(CodeBlock, { code:
`[[cm|// Inside the DO]]
[[var|err_durable]][[p|.]][[fn|packAs]]([[var|EErrorPackType]][[p|.]][[prop|msg_pack]]); [[cm|// one-time, at module top]]

[[kw|async]] [[fn|doWork]]() {
  [[kw|throw]] [[var|err_durable]][[p|.]][[fn|fromId]]([[str|"write_conflict"]], { [[prop|key]] })[[p|.]][[fn|pack]]();
}

[[cm|// From the Worker calling the stub]]
[[kw|try]] {
  [[kw|await]] [[var|stub]][[p|.]][[fn|doWork]]();
} [[kw|catch]] ([[var|e]]) {
  [[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|e]]); [[cm|// unpacks automatically]]
  [[kw|if]] ([[var|err_durable]][[p|.]][[fn|isExact]]([[var|error]])) { [[p|...]] }
}` })
  );
}

function P_RecWorker() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Pair actions with a Web Worker to dispatch typed RPC across ", React.createElement("code", null, "postMessage"), "."),
    React.createElement(CodeBlock, { tabs: [
      { label: "main.ts", code:
`[[kw|const]] [[var|worker]] [[p|=]] [[kw|new]] [[fn|Worker]]([[kw|new]] [[fn|URL]]([[str|"./worker.ts"]], [[var|import]][[p|.]][[prop|meta]][[p|.]][[prop|url]]));

[[var|worker_domain]][[p|.]][[fn|setActionRequester]]()[[p|.]][[fn|forDomain]]([[var|worker_domain]], ([[var|act]]) [[p|=>]] {
  [[kw|const]] [[var|wire]] [[p|=]] [[var|act]][[p|.]][[fn|toJsonObject]]();
  [[kw|return]] [[kw|new]] [[fn|Promise]](([[var|r]]) [[p|=>]] {
    [[var|worker]][[p|.]][[fn|addEventListener]]([[str|"message"]], (ev) [[p|=>]] [[var|r]]([[var|worker_domain]][[p|.]][[fn|hydrateResponse]]([[var|ev]][[p|.]][[prop|data]]))[[p|,]] { [[prop|once]]: [[kw|true]] });
    [[var|worker]][[p|.]][[fn|postMessage]]([[var|wire]]);
  });
});` },
      { label: "worker.ts", code:
`[[kw|const]] [[var|env]] [[p|=]] [[fn|createResponderEnvironment]]([
  [[fn|createDomainResolver]]([[var|worker_domain]])[[p|.]][[fn|resolveAction]]([[str|"crunch"]], ({ [[prop|data]] }) [[p|=>]] [[fn|heavyWork]]([[var|data]])),
]);
[[var|self]][[p|.]][[fn|onmessage]] [[p|=]] [[kw|async]] ([[var|ev]]) [[p|=>]] [[var|self]][[p|.]][[fn|postMessage]]([[kw|await]] [[var|env]][[p|.]][[fn|dispatch]]([[var|ev]][[p|.]][[prop|data]]));` },
    ]})
  );
}

// ---- Reference ----

function RefRow({ name, type, desc }) {
  return React.createElement("tr", null,
    React.createElement("td", null, React.createElement("code", null, name)),
    React.createElement("td", null, React.createElement("code", { style: { color: "var(--fg-3)" } }, type)),
    React.createElement("td", null, desc)
  );
}

function P_RefError() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Every export from ", React.createElement("code", null, "@nice-code/error"), ", grouped by surface."),
    React.createElement(S, { id: "definers" }, "Definers"),
    React.createElement("table", null,
      React.createElement("thead", null, React.createElement("tr", null,
        React.createElement("th", null, "Export"), React.createElement("th", null, "Signature"), React.createElement("th", null, "Description")
      )),
      React.createElement("tbody", null,
        React.createElement(RefRow, { name: "defineNiceError", type: "(opts) => NiceErrorDefined", desc: "Create a root error domain" }),
        React.createElement(RefRow, { name: "err", type: "<C>(meta?) => ErrSchemaEntry<C>", desc: "Define a schema entry with optional context type" }),
      )
    ),
    React.createElement(S, { id: "domain-methods" }, "Domain methods"),
    React.createElement("table", null,
      React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Method"), React.createElement("th", null, "Description"))),
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".createChildDomain(opts)")), React.createElement("td", null, "Create a child domain")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".fromId(id, ctx?)")), React.createElement("td", null, "Create a single-ID error")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".fromContext(map)")), React.createElement("td", null, "Create a multi-ID error")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".hydrate(error)")), React.createElement("td", null, "Re-hydrate a cast NiceError")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".isExact(err)")), React.createElement("td", null, "Type guard — exact domain match")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".isThisOrChild(err)")), React.createElement("td", null, "Ancestry check")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".isParentOf(target)")), React.createElement("td", null, "Domain ancestry probe")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".packAs(type)")), React.createElement("td", null, "Set default pack strategy")),
      )
    ),
    React.createElement(S, { id: "error-methods" }, "Error instance methods"),
    React.createElement("table", null,
      React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Method"), React.createElement("th", null, "Description"))),
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".hasId(id)")), React.createElement("td", null, "Type guard — narrows to single ID")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".hasOneOfIds(ids)")), React.createElement("td", null, "Type guard — narrows to subset")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".getContext(id)")), React.createElement("td", null, "Typed context for an active ID")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".getIds()")), React.createElement("td", null, "List all active IDs")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".addId(id, ctx?)")), React.createElement("td", null, "Return new error with id added")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".addContext(map)")), React.createElement("td", null, "Return new error with ids+ctx added")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".matches(other)")), React.createElement("td", null, "Domain+id fingerprint comparison")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".withOriginError(err)")), React.createElement("td", null, "Attach underlying cause")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".toJsonObject()")), React.createElement("td", null, "Serialize to plain JSON")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".pack(type?)")), React.createElement("td", null, "Pack for opaque transports")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".unpack()")), React.createElement("td", null, "Restore from packed state")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".handleWith(cases)")), React.createElement("td", null, "Dispatch, sync")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".handleWithAsync(cases)")), React.createElement("td", null, "Dispatch, async")),
      )
    ),
    React.createElement(S, { id: "helpers" }, "Helpers"),
    React.createElement("table", null,
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "forDomain(domain, handler)")), React.createElement("td", null, "Case matching any id in a domain")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "forIds(domain, ids, handler)")), React.createElement("td", null, "Case matching specific ids")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "matchFirst(error, handlers)")), React.createElement("td", null, "Pattern-match an error by id")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "castNiceError(value)")), React.createElement("td", null, "Cast any value to a NiceError")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "castAndHydrate(value, domain)")), React.createElement("td", null, "Cast + domain check + hydrate")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "isNiceErrorObject(value)")), React.createElement("td", null, "Type guard for serialized JSON")),
      )
    )
  );
}

function P_RefAction() {
  return React.createElement(React.Fragment, null,
    React.createElement("p", { className: "page-lede" }, "Every export from ", React.createElement("code", null, "@nice-code/action"), "."),
    React.createElement(S, { id: "definers" }, "Definers"),
    React.createElement("table", null,
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "createActionDomain(opts)")), React.createElement("td", null, "Create a root action domain")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "action()")), React.createElement("td", null, "Start a builder chain")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".input(opts)")), React.createElement("td", null, "Declare input schema + optional serde")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".output(opts)")), React.createElement("td", null, "Declare output schema + optional serde")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".throws(errDef, ids?)")), React.createElement("td", null, "Declare possible error types")),
      )
    ),
    React.createElement(S, { id: "domain-api" }, "Domain API"),
    React.createElement("table", null,
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".action(id)")), React.createElement("td", null, "Get a NiceAction by id")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".primeAction(id, input)")), React.createElement("td", null, "Shorthand for action(id).prime(input)")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".setActionRequester()")), React.createElement("td", null, "Register a dispatch handler")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".registerResponder(resolver)")), React.createElement("td", null, "Register a domain resolver")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".addActionListener(fn)")), React.createElement("td", null, "Observer callback")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".hydrateAction(wire)")), React.createElement("td", null, "Deserialize a primed action")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".hydrateResponse(wire)")), React.createElement("td", null, "Deserialize a response")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".matchAction(act, id)")), React.createElement("td", null, "Narrow primed action to specific id")),
      )
    ),
    React.createElement(S, { id: "execution" }, "Execution"),
    React.createElement("table", null,
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "NiceAction.execute(input?)")), React.createElement("td", null, "Execute, return raw output (may throw)")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "NiceAction.executeSafe(input?)")), React.createElement("td", null, "Execute, return NiceActionResult")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "NiceAction.prime(input)")), React.createElement("td", null, "Create NiceActionPrimed")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "NiceActionPrimed.toJsonObject()")), React.createElement("td", null, "Serialize to wire format")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "NiceActionPrimed.toJsonString()")), React.createElement("td", null, "Serialize to JSON string")),
      )
    ),
    React.createElement(S, { id: "resolvers" }, "Resolvers & environments"),
    React.createElement("table", null,
      React.createElement("tbody", null,
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "createDomainResolver(domain)")), React.createElement("td", null, "Create a resolver for a domain")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, ".resolveAction(id, fn)")), React.createElement("td", null, "Register a resolver function")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "createResponderEnvironment(resolvers)")), React.createElement("td", null, "Multi-domain responder")),
        React.createElement("tr", null, React.createElement("td", null, React.createElement("code", null, "env.dispatch(wire)")), React.createElement("td", null, "Deserialize + execute + serialize")),
      )
    )
  );
}

// Registry
const PAGES = {
  "introduction":     { title: "Introduction", subtitle: "What nice-code is and why you might want it.", Component: P_Introduction,
    headings: [ { id: "the-problem", title: "The problem" }, { id: "what-you-get", title: "What nice-code provides" }, { id: "error-package", title: "@nice-code/error", level: 3 }, { id: "action-package", title: "@nice-code/action", level: 3 }, { id: "packages", title: "Packages" } ] },
  "quick-start":      { title: "Quick Start", subtitle: "Get up and running in ten minutes.", Component: P_QuickStart,
    headings: [ { id: "install", title: "Install" }, { id: "error-in-5", title: "@nice-code/error in 5" }, { id: "define-domain", title: "1. Define", level: 3 }, { id: "throw-error", title: "2. Throw", level: 3 }, { id: "catch-narrow", title: "3. Catch + narrow", level: 3 }, { id: "across-boundary", title: "4. Serialize", level: 3 }, { id: "action-in-5", title: "@nice-code/action in 5" } ] },
  "install":          { title: "Installation", subtitle: "Everything nice-code needs to run — and what it needs from you.", Component: P_Install,
    headings: [ { id: "package-manager", title: "Package manager" }, { id: "typescript-config", title: "TypeScript" }, { id: "peer-deps", title: "Peer dependencies" } ] },
  "philosophy":       { title: "Philosophy", subtitle: "Three opinions that shaped the API.", Component: P_Philosophy,
    headings: [ { id: "opinion-1", title: "1. Errors are data" }, { id: "opinion-2", title: "2. Catch is a responsibility" }, { id: "opinion-3", title: "3. Actions travel" } ] },
  "err-domains":      { title: "Error Domains", subtitle: "Define typed error schemas and create errors from them.", Component: P_ErrDomains,
    headings: [ { id: "defining", title: "Defining a domain" }, { id: "err-builder", title: "The err() builder" }, { id: "creating", title: "Creating errors" }, { id: "origin", title: "Origin errors" } ] },
  "err-multi":        { title: "Multi-ID Errors", subtitle: "Carry multiple error ids at once when several conditions apply.", Component: P_ErrMulti,
    headings: [ { id: "from-context", title: "fromContext()" }, { id: "adding", title: "Adding ids" } ] },
  "err-hierarchy":    { title: "Domain Hierarchy", subtitle: "Parent/child domains and ancestry-aware type guards.", Component: P_ErrHierarchy,
    headings: [ { id: "child-domains", title: "Child domains" } ] },
  "err-serialization":{ title: "Serialization", subtitle: "Send errors across the wire and reconstruct them intact.", Component: P_ErrSerialization,
    headings: [ { id: "send", title: "Send" }, { id: "receive", title: "Receive" } ] },
  "err-handling":     { title: "Handling & Matching", subtitle: "Declarative error routing with handleWith and matchFirst.", Component: P_ErrHandling,
    headings: [ { id: "handle-with", title: "handleWith" }, { id: "match-first", title: "matchFirst" } ] },
  "err-type-guards":  { title: "Type Guards", subtitle: "Narrow errors by id, id-set, or domain.", Component: P_ErrTypeGuards,
    headings: [ { id: "hasId", title: "hasId" }, { id: "hasOneOfIds", title: "hasOneOfIds" }, { id: "domain-guards", title: "Domain guards" } ] },
  "err-packing":      { title: "Packing", subtitle: "Cross opaque boundaries (Durable Objects, RPC) without losing structure.", Component: P_ErrPacking,
    headings: [ { id: "pack", title: "Packing" }, { id: "unpack", title: "Unpacking" }, { id: "defaults", title: "Domain defaults" } ] },
  "act-domains":      { title: "Action Domains", subtitle: "Typed request/response surfaces with schemas and declared errors.", Component: P_ActDomains,
    headings: [ { id: "define", title: "Defining a domain" }, { id: "child", title: "Child domains" } ] },
  "act-executing":    { title: "Executing", subtitle: "Call actions safely or unsafely, from anywhere.", Component: P_ActExecuting,
    headings: [ { id: "execute", title: "execute / executeSafe" }, { id: "priming", title: "Priming" } ] },
  "act-requesters":   { title: "Requesters", subtitle: "The full-control handler pattern for cross-boundary dispatch.", Component: P_ActRequesters,
    headings: [ { id: "domain-handler", title: "forDomain" }, { id: "per-id", title: "forActionId" } ] },
  "act-resolvers":    { title: "Resolvers", subtitle: "The ergonomic handler pattern for local dispatch.", Component: P_ActResolvers,
    headings: [ { id: "local", title: "createDomainResolver" } ] },
  "act-wire":         { title: "Wire Format", subtitle: "Serialize actions, dispatch elsewhere, hydrate responses.", Component: P_ActWire,
    headings: [ { id: "prime", title: "Prime + serialize" }, { id: "env", title: "Responder environments" }, { id: "serde", title: "Custom serde" } ] },
  "act-errors":       { title: "Errors in Actions", subtitle: "Declare, throw, and narrow action errors end to end.", Component: P_ActErrors,
    headings: [ { id: "throws", title: "Declaring" }, { id: "safe-handling", title: "Safe handling" } ] },
  "rec-http":         { title: "HTTP boundary", subtitle: "Server ↔ client round-trip with full type fidelity.", Component: P_RecHTTP,
    headings: [ { id: "server", title: "Server" }, { id: "client", title: "Client" } ] },
  "rec-durable":      { title: "Durable Objects", subtitle: "Surviving Cloudflare's message-only error boundary.", Component: P_RecDurable, headings: [] },
  "rec-worker":       { title: "Web Workers", subtitle: "Typed RPC across postMessage with actions.", Component: P_RecWorker, headings: [] },
  "ref-error":        { title: "@nice-code/error", subtitle: "Every export, typed.", Component: P_RefError,
    headings: [ { id: "definers", title: "Definers" }, { id: "domain-methods", title: "Domain methods" }, { id: "error-methods", title: "Error methods" }, { id: "helpers", title: "Helpers" } ] },
  "ref-action":       { title: "@nice-code/action", subtitle: "Every export, typed.", Component: P_RefAction,
    headings: [ { id: "definers", title: "Definers" }, { id: "domain-api", title: "Domain API" }, { id: "execution", title: "Execution" }, { id: "resolvers", title: "Resolvers" } ] },
};

function DocPage({ pageId }) {
  const page = PAGES[pageId] || PAGES["introduction"];
  const flat = NICE_FLAT.find(p => p.id === pageId);
  return React.createElement(React.Fragment, null,
    React.createElement("div", { className: "breadcrumbs" },
      React.createElement("span", { className: "crumb" }, "Docs"),
      React.createElement("span", { className: "sep" }, "/"),
      React.createElement("span", { className: "crumb" }, (flat && flat.group) || "Getting Started"),
      React.createElement("span", { className: "sep" }, "/"),
      React.createElement("span", { className: "crumb current" }, page.title)
    ),
    React.createElement("h1", { className: "page-title" }, page.title),
    page.subtitle ? React.createElement("p", { className: "page-lede" }, page.subtitle) : null,
    React.createElement(page.Component)
  );
}

Object.assign(window, { DocPage, PAGES });
