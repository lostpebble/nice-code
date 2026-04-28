---
title: Introduction
description: What nice-code is, what problem it solves, and when to reach for it.
---

**nice-code** is two TypeScript packages that solve a single recurring problem:

> Errors and RPC responses that _should_ be typed and round-trippable — but almost never are.

If you've ever:

- Written `throw new Error("something happened")` and parsed `.message` on the other end,
- Invented your own `{ ok: false, code: "...", data: ... }` envelope for the third time,
- Lost type information the moment a response crossed a network boundary,

…then nice-code is for you.

## The packages

### `@nice-code/error`

Declare error _domains_ once. Every variant has a typed ID, typed context payload, an HTTP status code, and survives `JSON.stringify` / `JSON.parse` with its identity intact. Pattern-match on the other side with no casting.

### `@nice-code/action`

Declare actions with typed input, output, and declared errors. Call them from anywhere — locally, over HTTP, or over WebSocket — with full type inference. Same call site, same types, no codegen, no schema drift.

### `@nice-code/common-errors`

Shared error domains for Standard Schema validation errors and Hono middleware.

## What you won't find here

- A built-in validator. Use [Valibot](https://valibot.dev) or [Zod](https://zod.dev) at boundaries — `@nice-code/action` accepts any [Standard Schema](https://standardschema.dev)-compatible validator.
- An HTTP framework. Actions plug into whatever you use — Hono, Elysia, Next.js, raw `fetch`, custom transports.
- Magic. The libraries are readable TypeScript built on plain classes and functions.

## When to reach for it

| You have… | Reach for… |
|---|---|
| A typed RPC / action layer you keep reinventing | `@nice-code/action` |
| Errors that cross a boundary (HTTP, WebSocket, worker, queue) | `@nice-code/error` |
| A codebase where `try/catch` gives you `unknown` | `@nice-code/error` |
| Standard Schema validation errors you want typed and routable | `@nice-code/common-errors` |
| Server actions in Next.js / Remix / TanStack Start | both |

Next: [Quick start →](/getting-started/quick-start/)
