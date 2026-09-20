# Undercover Monorepo Audit Log

Running log of audited items, official documentation consulted, findings, and actions taken.

| Item | Docs Page Consulted | Finding | Action Taken |
| :--- | :--- | :--- | :--- |
| **Baseline: Tool Versions** | `bun.com/docs`, `nodejs.org` | Bun `1.3.14`, Node `v25.2.1`. Note: Node v25 is a non-LTS development release; production and CI should target Node 22 or 24 LTS. | Recorded in audit log. |
| **Baseline: Dependencies** | `package.json` across workspaces | `astro@7.3.3`, `@astrojs/react@4.2.1`, `tailwindcss@3.4.17`, `@tailwindcss/vite` (not installed yet), `wrangler@4.135.0`, `partyserver@0.0.60`, `zod@3.23.8`, `shadcn` (components.json configured for default style with radix-ui). | Baseline recorded. |
| **Phase 1: Node Engines** | `docs.astro.build/en/tutorial/1-setup/1/`, `vercel.com/docs/functions/runtimes/node-js` | Astro 7 requires even Node versions >=22.12.0. Vercel honors `package.json` `engines.node` and `.nvmrc`. Current local runtime is Node v25.2.1 (non-LTS); recommend 22 or 24 LTS for local dev and CI. | Added `"engines": { "node": ">=22" }` to root `package.json` and created `.nvmrc` pinned to `22`. |
| **Phase 1: Bun Linker** | `bun.com/docs/install/bunfig#linker` | Bun's `linker = "hoisted"` in `bunfig.toml` provides a flat `node_modules` layout, which avoids symlink resolution issues across workspaces for Astro, Vite, and Wrangler. `bun.lock` is tracked and internal deps use `workspace:*`. | Verified `linker = "hoisted"` in `bunfig.toml`; no change needed. |
| **Phase 2: Upgrade PartyServer & PartySocket** | `github.com/cloudflare/partykit/tree/main/packages/partyserver` | Upgraded `partyserver` from `0.0.60` to `^0.5.10` and `partysocket` from `^1.0.3` to `^1.3.0`. PartyServer 0.5.x features decoupled routing, robust lifecycle typing, connection state typing, and edge `onBeforeConnect` hook via `routePartykitRequest`. | Updated `apps/server/package.json`, `apps/web/package.json`, and lockfile. |
| **Phase 2: Wrangler & PartyServer Alignment** | `developers.cloudflare.com/durable-objects/`, `developers.cloudflare.com/workers/wrangler/configuration/#durable-objects` | Modern Cloudflare Wrangler supports declarative `exports` (`type: "durable-object"`, `storage: "sqlite"`), mutually exclusive with `migrations`. Edge origin check via `onBeforeConnect` in `routePartykitRequest`. Strict 2 KB size limit on raw messages prior to JSON parsing and Zod validation. Connection state restricted to `{ playerId }`. | Switched `wrangler.jsonc` to declarative `exports`, fixed `ALLOWED_ORIGINS` whitespace, updated `apps/server/src/index.ts`, added TODO stubs for `onStart` / `onAlarm`, regenerated `worker-configuration.d.ts`. |



