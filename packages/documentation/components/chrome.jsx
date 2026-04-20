/* global React, NICE_NAV, NICE_FLAT */

function Logo() {
  return React.createElement(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6 },
    React.createElement("rect", {
      x: 2.5,
      y: 2.5,
      width: 19,
      height: 19,
      rx: 5,
      stroke: "var(--accent)",
    }),
    React.createElement("path", { d: "M8 9h8M8 12h5M8 15h7", stroke: "var(--fg-0)" }),
    React.createElement("circle", { cx: 18, cy: 6, r: 1.5, fill: "var(--accent)", stroke: "none" }),
  );
}

function TopBar({ route, onOpenCmdk, onToggleTweaks, onNavigate }) {
  return React.createElement(
    "header",
    { className: "topbar" },
    React.createElement(
      "div",
      { className: "topbar-inner" },
      React.createElement(
        "a",
        {
          className: "brand",
          href: "#/",
          onClick: (e) => {
            e.preventDefault();
            onNavigate("/");
          },
        },
        React.createElement("span", { className: "mark" }, React.createElement(Logo)),
        React.createElement(
          "span",
          { className: "wordmark" },
          "nice",
          React.createElement("em", null, "code"),
        ),
        React.createElement("span", { className: "version" }, "v0.4.2"),
      ),
      React.createElement(
        "nav",
        { className: "topnav" },
        React.createElement(
          "a",
          {
            href: "#/docs/introduction",
            className: route.startsWith("/docs") ? "active" : "",
            onClick: (e) => {
              e.preventDefault();
              onNavigate("/docs/introduction");
            },
          },
          "Docs",
        ),
        React.createElement(
          "a",
          {
            href: "#/docs/ref-error",
            className: route.includes("ref-") ? "active" : "",
            onClick: (e) => {
              e.preventDefault();
              onNavigate("/docs/ref-error");
            },
          },
          "Reference",
        ),
        React.createElement(
          "a",
          { href: "https://github.com/lostpebble/nice-code", target: "_blank", rel: "noreferrer" },
          "GitHub",
        ),
      ),
      React.createElement("div", { className: "topbar-spacer" }),
      React.createElement(
        "button",
        { className: "search-btn", onClick: onOpenCmdk },
        React.createElement(
          "svg",
          {
            width: 14,
            height: 14,
            viewBox: "0 0 16 16",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.4,
          },
          React.createElement("circle", { cx: 7, cy: 7, r: 4.5 }),
          React.createElement("path", { d: "m10.5 10.5 3 3" }),
        ),
        React.createElement("span", { className: "sb-label" }, "Search docs..."),
        React.createElement("span", { className: "kbd" }, "⌘K"),
      ),
      React.createElement(
        "button",
        { className: "icon-btn", onClick: onToggleTweaks, title: "Settings" },
        React.createElement(
          "svg",
          { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 },
          React.createElement("circle", { cx: 8, cy: 8, r: 2 }),
          React.createElement("path", {
            d: "M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8 3.4 3.4",
          }),
        ),
      ),
      React.createElement(
        "a",
        {
          className: "icon-btn",
          href: "https://github.com/lostpebble/nice-code",
          target: "_blank",
          rel: "noreferrer",
          title: "GitHub",
        },
        React.createElement(
          "svg",
          { viewBox: "0 0 16 16", fill: "currentColor" },
          React.createElement("path", {
            d: "M8 .2a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.7 7.7 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.2.5.7.5 1.4v2.1c0 .2.2.5.6.4A8 8 0 0 0 8 .2z",
          }),
        ),
      ),
    ),
  );
}

function Sidebar({ route, onNavigate }) {
  const current = route.replace("/docs/", "");
  return React.createElement(
    "aside",
    { className: "sidebar" },
    NICE_NAV.map((group, gi) =>
      React.createElement(
        "div",
        { key: gi, className: "side-group" },
        React.createElement(
          "h4",
          { className: "side-heading" + (group.pkg === "action" ? " nice-action" : "") },
          group.pkg ? React.createElement("span", { className: "pkg-dot" }) : null,
          group.heading,
        ),
        React.createElement(
          "ul",
          { className: "side-list" },
          group.items.map((it) =>
            React.createElement(
              "li",
              { key: it.id, className: "side-item" },
              React.createElement(
                "a",
                {
                  href: "#/docs/" + it.id,
                  className: current === it.id ? "active" : "",
                  onClick: (e) => {
                    e.preventDefault();
                    onNavigate("/docs/" + it.id);
                  },
                },
                it.title,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function ToC({ headings, activeId }) {
  if (!headings || !headings.length) return null;
  return React.createElement(
    "aside",
    { className: "toc" },
    React.createElement("h4", { className: "toc-heading" }, "On this page"),
    React.createElement(
      "ul",
      null,
      headings.map((h) =>
        React.createElement(
          "li",
          { key: h.id, className: "lvl-" + (h.level || 2) },
          React.createElement(
            "a",
            {
              href: "#" + h.id,
              className: activeId === h.id ? "active" : "",
              onClick: (e) => {
                e.preventDefault();
                const el = document.getElementById(h.id);
                if (el) {
                  const y = el.getBoundingClientRect().top + window.scrollY - 68;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              },
            },
            h.title,
          ),
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "toc-foot" },
      React.createElement(
        "a",
        { href: "https://github.com/lostpebble/nice-code", target: "_blank", rel: "noreferrer" },
        React.createElement(
          "svg",
          { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 },
          React.createElement("path", { d: "M4 11 2 13l2 2M12 11l2 2-2 2M9.5 10.5 6.5 16" }),
        ),
        "Edit on GitHub",
      ),
      React.createElement(
        "a",
        {
          href: "https://github.com/lostpebble/nice-code/issues",
          target: "_blank",
          rel: "noreferrer",
        },
        React.createElement(
          "svg",
          { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 },
          React.createElement("circle", { cx: 8, cy: 8, r: 6 }),
          React.createElement("path", { d: "M8 5v3M8 10.5v.5" }),
        ),
        "Report an issue",
      ),
    ),
  );
}

function PageNav({ route, onNavigate }) {
  const cur = route.replace("/docs/", "");
  const idx = NICE_FLAT.findIndex((p) => p.id === cur);
  if (idx < 0) return null;
  const prev = NICE_FLAT[idx - 1];
  const next = NICE_FLAT[idx + 1];
  return React.createElement(
    "div",
    { className: "page-nav" },
    prev
      ? React.createElement(
          "a",
          {
            href: "#/docs/" + prev.id,
            onClick: (e) => {
              e.preventDefault();
              onNavigate("/docs/" + prev.id);
            },
          },
          React.createElement("div", { className: "dir" }, "← Previous"),
          React.createElement("div", { className: "label" }, prev.title),
        )
      : React.createElement("span", null),
    next
      ? React.createElement(
          "a",
          {
            className: "next",
            href: "#/docs/" + next.id,
            onClick: (e) => {
              e.preventDefault();
              onNavigate("/docs/" + next.id);
            },
          },
          React.createElement("div", { className: "dir" }, "Next →"),
          React.createElement("div", { className: "label" }, next.title),
        )
      : React.createElement("span", null),
  );
}

function CmdK({ open, onClose, onNavigate }) {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 10);
    }
  }, [open]);

  const results = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return NICE_FLAT;
    return NICE_FLAT.filter(
      (p) =>
        p.title.toLowerCase().includes(s) || p.group.toLowerCase().includes(s) || p.id.includes(s),
    );
  }, [q]);

  React.useEffect(() => {
    setSel(0);
  }, [q]);

  const go = (item) => {
    onNavigate("/docs/" + item.id);
    onClose();
  };

  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[sel]) {
      e.preventDefault();
      go(results[sel]);
    }
  };

  if (!open) return null;

  // Group results
  const grouped = {};
  results.forEach((r) => {
    (grouped[r.group] = grouped[r.group] || []).push(r);
  });

  let running = -1;
  return React.createElement(
    "div",
    {
      className: "cmdk-overlay",
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
    },
    React.createElement(
      "div",
      { className: "cmdk", onKeyDown: onKey },
      React.createElement(
        "div",
        { className: "cmdk-input-row" },
        React.createElement(
          "svg",
          { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 },
          React.createElement("circle", { cx: 7, cy: 7, r: 4.5 }),
          React.createElement("path", { d: "m10.5 10.5 3 3" }),
        ),
        React.createElement("input", {
          ref: inputRef,
          className: "cmdk-input",
          placeholder: "Search docs, APIs, recipes...",
          value: q,
          onChange: (e) => setQ(e.target.value),
        }),
        React.createElement("span", { className: "cmdk-close" }, "ESC"),
      ),
      React.createElement(
        "div",
        { className: "cmdk-list" },
        results.length === 0
          ? React.createElement("div", { className: "cmdk-empty" }, "No results for “" + q + "”")
          : Object.keys(grouped).map((gName) =>
              React.createElement(
                "div",
                { key: gName },
                React.createElement("div", { className: "cmdk-group-head" }, gName),
                grouped[gName].map((r) => {
                  running += 1;
                  const idx = running;
                  return React.createElement(
                    "div",
                    {
                      key: r.id,
                      className: "cmdk-item" + (idx === sel ? " selected" : ""),
                      onMouseEnter: () => setSel(idx),
                      onClick: () => go(r),
                    },
                    React.createElement("div", { className: "icon" }, "§"),
                    React.createElement("div", { className: "title" }, r.title),
                    React.createElement("div", { className: "crumb" }, r.group),
                  );
                }),
              ),
            ),
      ),
    ),
  );
}

function TweaksPanel({ open, onClose, state, onChange }) {
  const setK = (k, v) => onChange({ ...state, [k]: v });
  return React.createElement(
    "div",
    { className: "tweaks-panel" + (open ? " open" : "") },
    React.createElement(
      "div",
      { className: "tweaks-head" },
      React.createElement("span", { className: "ttl" }, "Tweaks"),
      React.createElement(
        "button",
        { className: "cmdk-close", onClick: onClose, style: { background: "none" } },
        "×",
      ),
    ),
    React.createElement(
      "div",
      { className: "tweak-row" },
      React.createElement("label", { className: "lab" }, "Accent"),
      React.createElement(
        "div",
        { className: "tweak-swatches" },
        [
          { k: "lime", c: "oklch(86% 0.18 125)" },
          { k: "orange", c: "oklch(76% 0.18 50)" },
          { k: "cyan", c: "oklch(82% 0.14 200)" },
          { k: "pink", c: "oklch(76% 0.2 0)" },
          { k: "violet", c: "oklch(76% 0.18 290)" },
        ].map((s) =>
          React.createElement("button", {
            key: s.k,
            className: "tweak-swatch" + (state.accent === s.k ? " active" : ""),
            style: { background: s.c },
            onClick: () => setK("accent", s.k),
            title: s.k,
          }),
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "tweak-row" },
      React.createElement("label", { className: "lab" }, "Display font"),
      React.createElement(
        "div",
        { className: "tweak-opts" },
        ["Instrument", "Geist", "Fraunces"].map((o) =>
          React.createElement(
            "button",
            {
              key: o,
              className: "tweak-opt" + (state.displayFont === o ? " active" : ""),
              onClick: () => setK("displayFont", o),
            },
            o,
          ),
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "tweak-row" },
      React.createElement("label", { className: "lab" }, "Density"),
      React.createElement(
        "div",
        { className: "tweak-opts" },
        ["Cozy", "Compact"].map((o) =>
          React.createElement(
            "button",
            {
              key: o,
              className: "tweak-opt" + (state.density === o ? " active" : ""),
              onClick: () => setK("density", o),
            },
            o,
          ),
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "tweak-row" },
      React.createElement("label", { className: "lab" }, "Landing hero"),
      React.createElement(
        "div",
        { className: "tweak-opts" },
        ["Split", "Centered", "Editorial"].map((o) =>
          React.createElement(
            "button",
            {
              key: o,
              className: "tweak-opt" + (state.hero === o ? " active" : ""),
              onClick: () => setK("hero", o),
            },
            o,
          ),
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "tweak-row" },
      React.createElement("label", { className: "lab" }, "Sidebar"),
      React.createElement(
        "div",
        { className: "tweak-opts" },
        ["Grouped", "Flat"].map((o) =>
          React.createElement(
            "button",
            {
              key: o,
              className: "tweak-opt" + (state.sidebar === o ? " active" : ""),
              onClick: () => setK("sidebar", o),
            },
            o,
          ),
        ),
      ),
    ),
  );
}

Object.assign(window, { TopBar, Sidebar, ToC, PageNav, CmdK, TweaksPanel, Logo });
