/* global React, CodeBlock, Callout */

function Landing({ onNavigate, heroVariant }) {
  const heroCode = `[[kw|import]] { [[var|defineNiceError]], [[var|err]] } [[kw|from]] [[str|"@nice-code/error"]];

[[kw|const]] [[var|err_billing]] [[p|=]] [[fn|defineNiceError]]({
  [[prop|domain]]: [[str|"err_billing"]],
  [[prop|schema]]: {
    [[prop|payment_failed]]: [[fn|err]]<{ [[prop|reason]]: [[type|string]] }>({
      [[prop|message]]: ({ [[prop|reason]] }) [[p|=>]] [[str|\`Payment failed: \${reason}\`]],
      [[prop|httpStatusCode]]: [[num|402]],
      [[prop|context]]: { [[prop|required]]: [[kw|true]] },
    }),
    [[prop|card_expired]]: [[fn|err]]({
      [[prop|message]]: [[str|"Card has expired"]],
      [[prop|httpStatusCode]]: [[num|402]],
    }),
  },
});

[[cm|// Fully typed — autocomplete on every id, context flows end-to-end]]
[[kw|throw]] [[var|err_billing]][[p|.]][[fn|fromId]]([[str|"payment_failed"]], { [[prop|reason]]: [[str|"card declined"]] });`;

  const renderHero = () => {
    if (heroVariant === "Centered") {
      return React.createElement(
        "section",
        { className: "landing", style: { gridTemplateColumns: "1fr", textAlign: "center", justifyItems: "center", padding: "120px 40px" } },
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "hero-eyebrow", style: { margin: "0 auto" } },
            React.createElement("span", { className: "badge" }, "v0.4.2"),
            "Typed errors + actions for TypeScript"
          ),
          React.createElement(
            "h1",
            { className: "hero-title", style: { margin: "28px auto" } },
            "Errors that ", React.createElement("em", null, "survive"),
            React.createElement("br"),
            "the ", React.createElement("span", { className: "acc" }, "network."),
          ),
          React.createElement(
            "p",
            { className: "hero-lede", style: { margin: "0 auto 32px" } },
            "nice-code turns errors and actions into first-class, typed, serializable values — crossing HTTP, RPC, workers and Durable Objects with full type fidelity intact."
          ),
          React.createElement(
            "div",
            { className: "hero-actions", style: { justifyContent: "center" } },
            React.createElement(
              "a",
              { className: "btn primary", href: "#/docs/introduction", onClick: (e) => { e.preventDefault(); onNavigate("/docs/introduction"); } },
              "Start reading",
              React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6 },
                React.createElement("path", { d: "M3 8h10M9 4l4 4-4 4" }))
            ),
            React.createElement(
              "a",
              { className: "btn ghost", href: "#/docs/quick-start", onClick: (e) => { e.preventDefault(); onNavigate("/docs/quick-start"); } },
              "Quick start"
            )
          )
        )
      );
    }
    if (heroVariant === "Editorial") {
      return React.createElement(
        "section",
        { className: "landing", style: { gridTemplateColumns: "1fr", padding: "100px 40px 64px" } },
        React.createElement(
          "div",
          { style: { maxWidth: 920 } },
          React.createElement("div", { className: "hero-eyebrow" },
            React.createElement("span", { className: "badge" }, "ISSUE 04"),
            "An essay on typed failure"
          ),
          React.createElement(
            "h1",
            { className: "hero-title", style: { fontSize: 128, lineHeight: 0.9 } },
            React.createElement("em", null, "Strings"),
            " are ",
            React.createElement("span", { className: "acc" }, "not"),
            " errors."
          ),
          React.createElement(
            "p",
            { className: "hero-lede", style: { fontSize: 21, maxWidth: 640, marginTop: 32 } },
            "Every boundary your program touches — the wire, the worker, the durable object — is a place where your error types usually die. nice-code is two small libraries that refuse to let that happen."
          ),
          React.createElement("div", { className: "hero-actions", style: { marginTop: 40 } },
            React.createElement("a", { className: "btn primary", href: "#/docs/introduction", onClick: (e) => { e.preventDefault(); onNavigate("/docs/introduction"); } }, "Read the introduction →"),
            React.createElement("a", { className: "btn ghost", href: "#/docs/quick-start", onClick: (e) => { e.preventDefault(); onNavigate("/docs/quick-start"); } }, "Quick start")
          )
        )
      );
    }
    // Default: Split
    return React.createElement(
      "section",
      { className: "landing" },
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "hero-eyebrow" },
          React.createElement("span", { className: "badge" }, "v0.4.2"),
          "Two packages. One idea."
        ),
        React.createElement(
          "h1",
          { className: "hero-title" },
          "Typed ", React.createElement("em", null, "errors"), ".",
          React.createElement("br"),
          "Typed ", React.createElement("span", { className: "acc" }, "actions"), ".",
          React.createElement("br"),
          "Zero ", React.createElement("em", null, "string-casts"), "."
        ),
        React.createElement(
          "p",
          { className: "hero-lede" },
          "nice-code makes errors and structured actions first-class citizens in TypeScript. Typed context, pattern matching, and safe serialization across every boundary your app crosses."
        ),
        React.createElement(
          "div",
          { className: "hero-actions" },
          React.createElement(
            "a",
            { className: "btn primary", href: "#/docs/introduction", onClick: (e) => { e.preventDefault(); onNavigate("/docs/introduction"); } },
            "Get started",
            React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6 }, React.createElement("path", { d: "M3 8h10M9 4l4 4-4 4" }))
          ),
          React.createElement(
            "a",
            { className: "btn ghost", href: "https://github.com/lostpebble/nice-code", target: "_blank", rel: "noreferrer" },
            React.createElement("svg", { viewBox: "0 0 16 16", fill: "currentColor" },
              React.createElement("path", { d: "M8 .2a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.7 7.7 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.2.5.7.5 1.4v2.1c0 .2.2.5.6.4A8 8 0 0 0 8 .2z" })),
            "GitHub"
          )
        ),
        React.createElement(
          "div",
          { className: "hero-install" },
          React.createElement("span", { className: "dollar" }, "$"),
          "bun add @nice-code/error @nice-code/action",
          React.createElement("button", {
            className: "copy",
            onClick: () => navigator.clipboard && navigator.clipboard.writeText("bun add @nice-code/error @nice-code/action"),
          },
            React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 },
              React.createElement("rect", { x: 5, y: 5, width: 8, height: 9, rx: 1.5 }),
              React.createElement("path", { d: "M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" })))
        )
      ),
      React.createElement(
        "div",
        { className: "hero-showcase" },
        React.createElement(
          "div",
          { className: "stack" },
          React.createElement(
            "div",
            { className: "card", style: { transform: "rotate(-1.2deg) translateX(-6px)" } },
            React.createElement("div", { className: "card-header" },
              React.createElement("div", { className: "dots" }, React.createElement("i"), React.createElement("i"), React.createElement("i")),
              React.createElement("span", null, "errors/billing.ts")
            ),
            React.createElement(CodeBlock, { code: heroCode, lang: "typescript" })
          )
        )
      )
    );
  };

  return React.createElement(
    "div",
    { className: "landing-wrap" },
    React.createElement("div", { className: "landing-bg" }),
    React.createElement("div", { className: "landing-grid" }),
    renderHero(),

    // Feature strip
    React.createElement(
      "div",
      { className: "feature-strip" },
      React.createElement(
        "div",
        { className: "inner" },
        [
          { ft: "Typed context", fd: "Context flows from creation through narrowing to access — no casts.", d: "M2 8l3 3 7-7" },
          { ft: "Safe on the wire", fd: "Serialize to JSON, reconstruct on the other side — same types.", d: "M2 5h12M2 11h12" },
          { ft: "Pattern matching", fd: "handleWith, matchFirst, forDomain, forIds — exhaustive and typed.", d: "M4 4h3v3H4zM9 4h3v3H9zM4 9h3v3H4zM9 9h3v3H9z" },
          { ft: "Works everywhere", fd: "HTTP, RPC, Web Workers, Durable Objects — built for the edge.", d: "M8 2 2 8l6 6 6-6z" },
        ].map((f, i) =>
          React.createElement(
            "div",
            { key: i, className: "f" },
            React.createElement(
              "div",
              { className: "ico" },
              React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5 },
                React.createElement("path", { d: f.d }))
            ),
            React.createElement("div", null,
              React.createElement("div", { className: "ft" }, f.ft),
              React.createElement("div", { className: "fd" }, f.fd)
            )
          )
        )
      )
    ),

    // Packages section
    React.createElement(
      "section",
      { className: "section" },
      React.createElement("div", { className: "section-eyebrow" }, "The packages"),
      React.createElement("h2", { className: "section-title" },
        "Two small libraries,", React.createElement("br"),
        React.createElement("em", null, "one ergonomic surface.")
      ),
      React.createElement("p", { className: "section-lede" },
        "Use errors alone, or add actions on top. Every API composes — errors declared with ", React.createElement("code", null, "defineNiceError"), " plug straight into action ", React.createElement("code", null, ".throws()"), " clauses."
      ),
      React.createElement(
        "div",
        { className: "split" },
        React.createElement(
          "div",
          { className: "pkg-card" },
          React.createElement("div", { className: "pkg-name" }, "@nice-code/error"),
          React.createElement("h3", null, "Errors as ", React.createElement("em", null, "data")),
          React.createElement("p", { className: "pkg-lede" }, "Declare your error schema up front. Every id, every context field, every http status — typed and reachable from any catch."),
          React.createElement("ul", { className: "pkg-bullets" },
            React.createElement("li", null, "Typed context with optional / required modes"),
            React.createElement("li", null, "Multi-id errors with fingerprint comparison"),
            React.createElement("li", null, "Parent/child domain hierarchies"),
            React.createElement("li", null, "castNiceError · handleWith · matchFirst"),
            React.createElement("li", null, "Packing for opaque boundaries (DOs, RPC)")
          ),
          React.createElement("a",
            { className: "pkg-cta", href: "#/docs/err-domains", onClick: (e) => { e.preventDefault(); onNavigate("/docs/err-domains"); } },
            "Read the guide →")
        ),
        React.createElement(
          "div",
          { className: "pkg-card b" },
          React.createElement("div", { className: "pkg-name purple" }, "@nice-code/action"),
          React.createElement("h3", null, "Actions that ", React.createElement("em", null, "travel")),
          React.createElement("p", { className: "pkg-lede" }, "Typed request/response pairs with schema validation and custom serialization. Dispatch locally or across a wire — the client never has to care."),
          React.createElement("ul", { className: "pkg-bullets" },
            React.createElement("li", null, "Valibot-based input / output schemas"),
            React.createElement("li", null, "Custom serde (Dates, BigInts, etc.)"),
            React.createElement("li", null, ".throws() integrates nice-code errors"),
            React.createElement("li", null, "Resolvers for local · Requesters for remote"),
            React.createElement("li", null, "Responder environments for cross-process dispatch")
          ),
          React.createElement("a",
            { className: "pkg-cta", href: "#/docs/act-domains", onClick: (e) => { e.preventDefault(); onNavigate("/docs/act-domains"); } },
            "Read the guide →")
        )
      )
    ),

    // Code-centered section
    React.createElement(
      "section",
      { className: "section", style: { paddingTop: 0 } },
      React.createElement("div", { className: "section-eyebrow" }, "End to end"),
      React.createElement("h2", { className: "section-title" },
        "From ", React.createElement("em", null, "throw"), " to ", React.createElement("em", null, "catch"), " —",
        React.createElement("br"), "same types, different continent."
      ),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 } },
        React.createElement(CodeBlock, {
          tabs: [
            { label: "server.ts", code: `[[cm|// Server — throw and serialize]]
[[kw|const]] [[var|error]] [[p|=]] [[var|err_order]][[p|.]][[fn|fromId]]([[str|"out_of_stock"]], { [[prop|sku]] });
[[kw|return]] [[var|Response]][[p|.]][[fn|json]]([[var|error]][[p|.]][[fn|toJsonObject]](), {
  [[prop|status]]: [[var|error]][[p|.]][[prop|httpStatusCode]]
});` },
          ]
        }),
        React.createElement(CodeBlock, {
          tabs: [
            { label: "client.ts", code: `[[cm|// Client — cast, narrow, act]]
[[kw|const]] [[var|body]] [[p|=]] [[kw|await]] [[var|res]][[p|.]][[fn|json]]();
[[kw|const]] [[var|error]] [[p|=]] [[fn|castNiceError]]([[var|body]]);

[[kw|if]] ([[var|err_order]][[p|.]][[fn|isExact]]([[var|error]])) {
  [[var|error]][[p|.]][[fn|getContext]]([[str|"out_of_stock"]])[[p|.]][[prop|sku]]; [[cm|// string ✓]]
}` },
          ]
        })
      )
    )
  );
}

Object.assign(window, { Landing });
