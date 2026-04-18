# Documentation — nice-code

Slick documentation site for `@nice-code/error` and `@nice-code/action`, built on **Astro Starlight**.

## Structure

```
packages/documentation/
├── astro.config.mjs           # Starlight config (nav, search, custom components)
├── package.json
├── tsconfig.json
├── src/
│   ├── assets/
│   │   └── logo.svg           # Lime accent mark
│   ├── components/            # Starlight component overrides
│   │   ├── Hero.astro         # Custom splash-page hero
│   │   ├── Head.astro         # <head> additions
│   │   └── Footer.astro       # Custom footer
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx      # Landing / splash page
│   │       ├── 404.md         # Custom 404 page
│   │       ├── getting-started/
│   │       ├── nice-error/
│   │       ├── nice-action/
│   │       └── reference/
│   ├── content.config.ts      # Starlight content collection
│   ├── styles/
│   │   ├── theme.css          # Design tokens, font imports, dark palette
│   │   ├── starlight-overrides.css  # Header, sidebar, TOC, markdown, pager
│   │   └── syntax.css         # Code-block tweaks
│   └── env.d.ts
└── public/                    # (static assets)
```

## Design

- Dark, refined base — grain overlay, subtle atmospheric gradients
- Electric lime accent (`oklch(86% 0.18 125)`)
- Instrument Serif display + Geist body + Geist Mono code
- Hairline dividers, flat surfaces, no gradient CTAs

## Features

- **Search**: Pagefind (built into Starlight) — press `⌘K` / `Ctrl+K`
- **Custom hero** on the landing splash with live-looking code card
- **Custom 404** that fits the brand
- **Sidebar** grouped into Getting Started · @nice-code/error · @nice-code/action · Reference
- **Right-rail TOC** with scroll-spy (provided by Starlight)
- **Prev/Next pager** between doc pages
- **Expressive Code** with `github-dark` theme + Geist Mono + copy buttons

## Run

```bash
cd packages/documentation
bun install
bun dev          # → http://localhost:4321
bun build        # → dist/
bun preview
```

## Preview (without Astro)

`index.html` in this folder is a static design preview that shows the same look and feel without needing the Astro dev server. Useful for review inside this environment.
