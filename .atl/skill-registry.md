# Skill Registry

Project: Leads Codex
Generated: 2026-04-24
Scope: project

## Compact Rules

### Core project rules
- Never add AI attribution or `Co-Authored-By` to commits; use conventional commits only.
- Never build after changes; use type-check / targeted validation instead.
- Verify technical claims in code/docs before stating them.
- Push back on weak assumptions; prefer evidence over agreement.
- Spanish responses should use Rioplatense Spanish tone.
- Favor concepts, architecture, and maintainability over quick hacks.

### Frontend / product rules
- Keep the app usable even when external variables are missing; surface clear readiness states in the UI.
- No auth flows; prefer local exports and zero-login UX.
- Distinguish clearly between demo data and real integrations.
- Improve UX with explicit empty, loading, error, and configured states.

### Quality rules
- TypeScript type-check is the baseline validation command: `npm run lint`.
- Do not claim runtime success without verifying a live port or command output.
- For server-side URL fetching, block localhost/private-network targets.

## User Skills

| Skill | Trigger | Notes |
| --- | --- | --- |
| frontend-design | UI/UX improvements, layout polish, design systems, component visual refactors | Primary skill for this project's product-facing work |
| go-testing | Go tests / Bubbletea TUI testing | Available globally, not currently relevant to this stack |
| skill-creator | Creating new AI skills | Available globally |

## Detected Project Conventions
- Stack: React 19 + Vite 6 + TypeScript + Express + Tailwind v4
- Validation: `npm run lint` runs `tsc --noEmit`
- Runtime: `npm run dev` runs `tsx server.ts`
- Architecture: single Express server as API + Vite middleware; frontend in `src/`
- Product constraint: app should remain demo-usable until env vars are configured

## Sources
- Session-provided AGENTS instructions for `/Users/damian/Dev/Leads Codex`
- `/Users/damian/Dev/Leads Codex/package.json`
- `/Users/damian/Dev/Leads Codex/server.ts`
- `/Users/damian/Dev/Leads Codex/src/`
