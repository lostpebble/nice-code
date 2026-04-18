---
title: Introduction
description: What nice-code is, what problem it solves, and when to reach for it.
---

**nice-code** is two small TypeScript packages that solve a single annoying problem:

> Errors and RPC responses that _should_ be typed, serialized, and round-tripped safely — but almost never are.

If you've ever:

- `throw new Error("something happened")` and had to parse the message on the other end,
- invented your own `{ ok: false, code: "...", ...etc }` envelope for the third time,
- or lost type information the moment a response crossed the network,

…then nice-code is for you.

## The two packages

- **`@nice-code/error`** — declare error _domains_ once. Every variant is a class, has a typed payload, and survives `JSON.stringify` / `JSON.parse` with its identity intact.
- **`@nice-code/action`** — declare server actions with typed input, output and errors. Call them from the client with full inference. No codegen, no OpenAPI, no schema drift.

Both are zero-dependency, tree-shakable, and runtime-agnostic.

## What you won't find here

- A validator. Use [Valibot](https://valibot.dev) or [Zod](https://zod.dev) at boundaries.
- An HTTP framework. Actions plug into whatever you use — fetch, Hono, Elysia, Next.js, tRPC-style setups, WebSocket transports.
- Magic. The whole library is under 400 lines of readable TypeScript.

## When to reach for it

| You have… | Reach for… |
|---|---|
| A typed RPC / action layer you keep reinventing | `@nice-code/action` |
| Errors that cross a boundary (HTTP, worker, IPC, queue) | `@nice-code/error` |
| A codebase where `try/catch` gives you `unknown` and nothing more | `@nice-code/error` |
| Server actions in Next.js / Remix / TanStack Start | both |

Next: [Quick start →](/getting-started/quick-start/)
