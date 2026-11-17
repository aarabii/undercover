# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source readiness documentation (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `ROADMAP.md`, `CHANGELOG.md`, and `docs/word-packs.md`).
- Word pack validation script and checks for word bank integrity.
- Configurable self-hosting environment variables for client and server deployments.

## [0.1.0] - 2026-10-24

### Added

- Pure, deterministic game engine (`@game/engine`) supporting 4–20 players across Civilian, Undercover, and Mr. White roles, with phase timers, vote tallying, tie handling, and forgiving Mr. White final guess normalization.
- Real-time server (`apps/server`) on Cloudflare Workers and PartyServer Durable Objects with SQLite state persistence, automatic host migration, disconnect grace periods, Cloudflare Turnstile verification, and IP rate limiting.
- Zero-login web client (`apps/web`) built with Astro 7, React 19, Zustand, and Tailwind CSS v4 Neo-brutalist dossier design system, including QR code room invites, tab-blur secret card auto-hide, and PartySocket auto-reconnection.
- Curated 260-pair word bank (`@game/words`) across 12 categories and 4 difficulty tiers (`easy`, `medium`, `hard`, `fan_fav`) with 50/50 Civilian/Undercover word swap and seeded Mulberry32 PRNG.
- Shared Zod 4 protocol schemas (`@game/protocol`), zero-dependency TypeScript models (`@game/types`), unit/simulation/workerd/Playwright test suites, and client/server package boundary checks.

[Unreleased]: https://github.com/aarabii/undercover/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aarabii/undercover/releases/tag/v0.1.0
