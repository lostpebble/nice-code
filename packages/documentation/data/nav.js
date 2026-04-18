/* global window */
// Content for nicecode.io docs — data-driven. Keep copy close to the real README
// so the docs feel authentic to the actual package.

const NAV = [
  {
    heading: "Getting Started",
    items: [
      { id: "introduction", title: "Introduction" },
      { id: "quick-start", title: "Quick Start" },
      { id: "install", title: "Installation" },
      { id: "philosophy", title: "Philosophy" },
    ],
  },
  {
    heading: "@nice-code/error",
    pkg: "error",
    items: [
      { id: "err-domains", title: "Error Domains" },
      { id: "err-multi", title: "Multi-ID Errors" },
      { id: "err-hierarchy", title: "Domain Hierarchy" },
      { id: "err-serialization", title: "Serialization" },
      { id: "err-handling", title: "Handling & Matching" },
      { id: "err-type-guards", title: "Type Guards" },
      { id: "err-packing", title: "Packing" },
    ],
  },
  {
    heading: "@nice-code/action",
    pkg: "action",
    items: [
      { id: "act-domains", title: "Action Domains" },
      { id: "act-executing", title: "Executing" },
      { id: "act-requesters", title: "Requesters" },
      { id: "act-resolvers", title: "Resolvers" },
      { id: "act-wire", title: "Wire Format" },
      { id: "act-errors", title: "Errors in Actions" },
    ],
  },
  {
    heading: "Recipes",
    items: [
      { id: "rec-http", title: "HTTP boundary" },
      { id: "rec-durable", title: "Durable Objects" },
      { id: "rec-worker", title: "Web Workers" },
    ],
  },
  {
    heading: "Reference",
    items: [
      { id: "ref-error", title: "@nice-code/error" },
      { id: "ref-action", title: "@nice-code/action" },
    ],
  },
];

// Flat list, useful for prev/next and command palette
const FLAT = NAV.flatMap(g => g.items.map(it => ({ ...it, group: g.heading })));

window.NICE_NAV = NAV;
window.NICE_FLAT = FLAT;
