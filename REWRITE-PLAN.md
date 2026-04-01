# Internal Docs — IA Redesign + Content Rewrite Plan

## Context
This is a plan for Codex to implement the full information architecture restructure and content rewrite of the BlockMind internal docs site at `/tmp/blockmind-internal-docs`.

## Verified Facts (from production codebase)

### Chat Flow Reality
- Relay launches with `ingestPath: '/api/elite/ingest'` and separate `browserEventsUrl` and artifact endpoint
- `/api/elite/ingest` is a TanStack file route (NOT oRPC), accepts bearer auth via `resolveAgentCallbackAuthContext`
- Ingest event types (discriminated union): `upstream`, `child-session-link`, `run-started`, `run-usage-summary`, `assistant-chart-candidate`, `assistant-complete`, `error`, `heartbeat`, `tool-result-pending`, `tool-result-ready`, `tool-result-failed`, `research-activity`
- Platform transforms ingest events → durable stream events via `applyEliteRunIngestEvents` in `runs.ts`
- `/api/elite/chat` is also a file route, NOT oRPC
- Browser events go to separate `/api/elite/browser-events` endpoint

### Credit System Reality
- Action-type pricing (NOT model-tier): `chat`, `data_fetch`, `portfolio_scan`, `morning_brief`, `analysis`, `kol_analysis`, `deep_dive`
- Each action type has `floor` (minimum cost) and `reserveCap` (max reservation)
- Balances are **user-scoped** (`userId` in `credit_balances`), NOT per-org
- Transaction types: `monthly_grant`, `invite_bonus`, `referral_bonus`, `topup_purchase`, `action_deduction`, `action_reserve`, `action_refund`
- Transaction statuses: `pending`, `completed`, `refunded`
- Flow: `reserveCredits` (pre-flight) → run → `settleReservation` (actual cost or refund)
- Tiers: free(30), starter(275), pro(990), elite(3025), elite-plus(10450)

### Provisioning Flow Reality (actual Inngest step order)
1. `create-workspace-record` (status: queued → provisioning)
2. `claim-pool-machine` OR `generate-keys-and-create-fly-resources` (warm pool vs cold create)
3. `provision-agentmail-pod` (AgentMail pod — NOT inbox)
4. `activate-workspace` (status → active)
5. `wait-for-machine-started`
6. `sync-workspace-machine-binding`
7. `write-workspace-files` + `wait-for-gateway-ready` (PARALLEL)
8. `seed-security-config`
9. `create-wake-schedules`
10. `provision-agentmail-inbox` (best-effort, separate from pod)
11. `finalize-workspace`
12. `trigger-session-bootstrap` (sendEvent)
13. `delete-claimed-pool-machine-record` (cleanup if pool claim)
14. `restore-machine-autostop`
- Compensation: `compensate-destroy-fly` → `compensate-delete-pool-machine-record` → `compensate-keys` → `mark-workspace-failed`

### Workspace States (from DB enum)
`queued` → `provisioning` → `seeding` → `active` → `suspended` | `degraded` | `failed` | `destroyed`

### Chat Run States (from DB enum)
`starting` → `running` → `settling` → `completed` | `failed` | `timed_out`
Active states: `starting`, `running`, `settling`

### Auth Reality
- `emailAndPassword: { enabled: false }` — NO email/password
- Social: Google only (no GitHub)
- Plugins: `anonymous`, `bearer`, `organization`
- Custom fields: `isAnonymous`, `role`, `emailConsent`
- Anonymous accounts link on signup
- Bearer tokens for agent callbacks (workspace:write scope)

## New Navigation Structure

```
content/docs/
├── index.mdx                    # Landing: product summary + two reading paths
├── meta.json                    # Top nav: Overview, Architecture, Operations, Decisions
├── overview/
│   ├── meta.json
│   ├── index.mdx               # "BlockMind in 2 minutes" + system landscape diagram
│   ├── elite.mdx               # What Elite is, why, key user experience
│   └── business-model.mdx      # Credit system from product POV
├── architecture/
│   ├── meta.json
│   ├── index.mdx               # Reading guide + container overview
│   ├── platform.mdx            # TanStack Start, file routes, oRPC, auth surface
│   ├── elite-runtime.mdx       # Fly machines, gateway, agent lifecycle, tools
│   ├── chat-flow.mdx           # REWRITE — accurate relay → ingest → durable stream
│   ├── provisioning.mdx        # REWRITE — accurate 14-step flow with compensation
│   ├── credits.mdx             # REWRITE — action-type pricing, reserve/settle
│   ├── durable-streams.mdx     # NEW — event types, replay, recovery, collections
│   └── auth.mdx                # REWRITE — real auth surface
├── operations/
│   ├── meta.json
│   ├── index.mdx               # What this section covers
│   ├── workspace-states.mdx    # State machine from DB enum
│   └── chat-run-states.mdx     # State machine from DB enum
├── decisions/
│   ├── meta.json
│   ├── index.mdx               # ADR index
│   └── 001-docs-platform.mdx   # Existing (keep)
```

### Deleted
- `content/docs/systems/` (entire directory)
- `content/docs/agents/` (entire directory)

## Page Guidelines (NOT a rigid template)
- Every page starts with a plain-language summary (2-4 sentences, no jargon). Product people stop here.
- Engineering detail follows naturally. Use tables, diagrams, and code references where they help.
- Status footer on architecture/operations pages: `Last verified: YYYY-MM-DD against commit <short-hash>`
- No empty sections. No placeholder content. Every page ships with real content.
- Keep existing D2Diagram references where diagrams are accurate. Remove where they're wrong (we'll update diagrams separately).

## Implementation Order
1. Create new directory structure and meta.json files
2. Write new landing page (index.mdx)
3. Write overview/ pages (CEO track)
4. Rewrite architecture/ pages (P0 fixes: chat-flow, credits, provisioning, auth)
5. Write new pages (durable-streams, elite-runtime)
6. Write operations/ pages (state machines from real DB enums)
7. Remove old systems/ and agents/ directories
8. Update architecture/index.mdx and architecture/meta.json
9. Verify build passes
