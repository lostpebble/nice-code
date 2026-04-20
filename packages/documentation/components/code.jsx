/* global React */
// Minimal, static syntax highlighter — takes raw code with inline [[tk:kind|text]] markers
// and renders spans. Keeps code sample source readable in JSX strings.

function renderTokens(src) {
  // src is a string with markers like [[kw|const]], [[str|"x"]], [[num|42]], [[cm|// comment]],
  // [[fn|name]], [[type|Type]], [[p|.]], [[prop|field]], [[acc|accent]]
  const parts = [];
  const regex = /\[\[(kw|str|num|cm|fn|type|p|prop|acc|var)\|([\s\S]*?)\]\]/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = regex.exec(src)) !== null) {
    if (m.index > last) parts.push(src.slice(last, m.index));
    parts.push(React.createElement("span", { key: key++, className: "tk-" + m[1] }, m[2]));
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push(src.slice(last));
  return parts;
}

function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);
  return React.createElement(
    "button",
    {
      className: "copy-btn" + (copied ? " copied" : ""),
      onClick: (e) => {
        e.stopPropagation();
        navigator.clipboard && navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
    },
    React.createElement(
      "svg",
      { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 },
      copied
        ? React.createElement("path", { d: "M3.5 8.5l3 3 6-6" })
        : React.createElement(
            "g",
            null,
            React.createElement("rect", { x: 5, y: 5, width: 8, height: 9, rx: 1.5 }),
            React.createElement("path", { d: "M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" }),
          ),
    ),
    copied ? "Copied" : "Copy",
  );
}

function stripMarkers(src) {
  return src.replace(/\[\[(?:kw|str|num|cm|fn|type|p|prop|acc|var)\|([\s\S]*?)\]\]/g, "$1");
}

// CodeBlock with optional tabs.
// Props: { tabs: [{label, lang, filename, code}] } OR { lang, filename, code }
function CodeBlock(props) {
  const tabs = props.tabs || [
    {
      label: props.filename || props.lang || "code",
      lang: props.lang,
      filename: props.filename,
      code: props.code,
    },
  ];
  const [idx, setIdx] = React.useState(0);
  const active = tabs[idx];
  const raw = stripMarkers(active.code);

  return React.createElement(
    "div",
    { className: "code-card" + (props.term ? " term" : "") },
    React.createElement(
      "div",
      { className: "code-head" },
      tabs.length > 1
        ? React.createElement(
            "div",
            { className: "code-tabs" },
            tabs.map((t, i) =>
              React.createElement(
                "button",
                {
                  key: i,
                  className: "code-tab" + (i === idx ? " active" : ""),
                  onClick: () => setIdx(i),
                },
                t.label,
              ),
            ),
          )
        : React.createElement(
            "span",
            { className: active.filename ? "code-filename" : "code-lang" },
            active.filename || active.lang || "ts",
          ),
      React.createElement("div", { className: "code-spacer" }),
      active.lang
        ? React.createElement(
            "span",
            { className: "code-lang", style: { marginRight: 8 } },
            active.lang,
          )
        : null,
      React.createElement(CopyButton, { text: raw }),
    ),
    React.createElement(
      "div",
      { className: "code-body" },
      React.createElement("pre", null, renderTokens(active.code)),
    ),
  );
}

function Callout({ label = "Note", children }) {
  return React.createElement(
    "div",
    { className: "callout" },
    React.createElement("span", { className: "cal-label" }, label),
    children,
  );
}

Object.assign(window, { CodeBlock, Callout, CopyButton, renderTokens });
