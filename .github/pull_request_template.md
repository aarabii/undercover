## Summary

<!-- Briefly describe what this pull request changes and why. -->

Closes #

## Checklist

- [ ] `bun run typecheck` passes across all workspaces
- [ ] `bun run test` (and `bun run test:server` if server code changed) passes
- [ ] `bun run check:boundaries` passes (`apps/web` does not import `@game/words`)
- [ ] `bun run validate:words` passes (if `packages/words` was modified)
- [ ] Documentation under `docs/` or `README.md` updated if behavior or configuration changed
