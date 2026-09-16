# HireMeow project instructions

Read `START-HERE.md` and `TECHNICAL-HANDOFF.md` before changes.

## Scope

This is the owner's existing HireMeow website, a Thailand career companion for international students and graduates. Work in this folder. Preserve existing features and the Siamese-cat/Thailand identity unless the user's requested change says otherwise. Work from the existing source rather than recreating the site from a screenshot.

## Commands

- Node.js 20.12+ (24 recommended); no `npm install`. Supabase JS and Leaflet are vendored in `public/assets/vendor/` (do not replace with CDN links).
- `npm test`: offline tests with mocked OpenAI, Supabase and Stripe responses.
- `npm run test:sql`: schema + RLS behaviour tests against a local Postgres (Supabase stubs in `supabase/test/`).
- `npm run build`: regenerates `dist/` from `public/` and `server/`.
- `npm run dev`: full stack (static site + `server/app.js` API) on 127.0.0.1:4278, reading `.env`.
- On this Mac, if Node/npm are absent from PATH, use `bash 'Check HireMeow.command'` or `bash 'Preview HireMeow.command'`. These find the installed bundled Node runtime.

## Source structure

- `public/assets/hiremeow-app.js`: readable React.createElement layout, navigation, hero, footer.
- `public/assets/hiremeow.css`: HireMeow design and responsive rules.
- `public/assets/career-chat.js` and `career-chat.css`: chat interface.
- `public/assets/hiremeow-live.js`: API client, bounded history, explicit fallback.
- `public/assets/career-knowledge.js` and `visa-guidance.js`: saved answers and guided logic.
- `public/assets/employers.json`: demo employer directory.
- `server/worker.js`: OpenAI Responses and optional web search; API validation/auth.
- `public/assets/index-C--u-fTV.js`: compiled original React/runtime and legacy components; avoid wholesale formatting or replacement. Readable original TSX sources are not available.
- `public/assets/platform/`: live platform (Supabase auth, jobs, company dashboard, Reverse Hiring, pitches, Meow Pool, admin, map, BTS/MRT stations).
- `public/assets/meow-lab.js`, `meow-demos.js`, `profile-dashboard.js`: Meow Lab, demo previews, device-only notes.
- AI features (see README §4b): `server/agent.js` (Meow Agent), `server/skills.js` (all structured AI tools + public job chat), `public/assets/platform/agent.js`, `studio.js` (AI Studio, job-card tools, portfolio page, Meow Copilot), `skills-dict.js` (deterministic match %). AI may only prepare actions; database writes happen after the user confirms. Keep fairness rules in screening prompts.
- `server/app.js`: Vercel/Node API (config, chat, ai, Stripe, cron). `api/router.js` + `vercel.json` deploy it.
- `server/jobs/`, `server/news/`, `server/mailer.js`: Ghosting Protection, Layoff Radar (mock news), mock email.
- `supabase/schema.sql`, `supabase/seed.sql`: database, RLS, storage bucket. Business rules live in SQL triggers; keep UI and SQL in sync.
- `dist/` is generated for the OpenAI Sites deployment. Make changes in source, then rebuild.

## Credentials and runtime

Supabase, Stripe and OpenAI keys come from `.env` / Vercel environment variables (see `.env.example`). `SUPABASE_SERVICE_KEY` and `STRIPE_*` are server-only. Stripe must stay in test mode unless the owner sets `STRIPE_ALLOW_LIVE=1`.


No API key is included in this folder. Do not read credentials from the original checkout or other folders. Do not request keys in chat, expose them, hardcode them, commit them, or put them in browser assets. The live Sites deployment already has `OPENAI_API_KEY` stored as a secret. `OPENAI_MODEL` is optional; the existing default is `gpt-5-mini`. Preserve the provider and model unless a change is requested.

The Sites worker requires same-origin POSTs and the hosting-provided `oai-authenticated-user-id` header for live chat. On Vercel, `server/app.js` strips client-supplied `oai-*` headers and uses the Supabase user instead. Do not remove this check merely to make a preview or anonymous request pass. The local preview inserts a development identity and binds to loopback only. Public page visibility and authenticated live-chat access are separate; test both when changing access behavior.

## Quality

Keep mobile navigation, keyboard access, focus, reduced-motion support, language options, bounded history, and clickable safe citations. Keep `store:false`, explicit saved-answer fallback, and user-input validation. The legacy employer directory, university dashboard and Meow Lab demo previews are demo data; the Supabase-backed features are real. Do not turn them into claims of verified jobs or live integrations.

Run relevant existing tests and build after changes. Use mocked API tests for normal iteration; paid live requests require appropriate user intent and a securely configured key. Never report a successful live test from mock results.

## Publishing

Vercel: see README §5 (`vercel.json`, cron jobs, env vars). OpenAI Sites (original URL) continues to use the steps below.

This folder is a separate editable snapshot. The existing public URL is recorded in `TECHNICAL-HANDOFF.md`. Preserve `.openai/hosting.json` and its exact project ID. Local editing is not deployment. Use an authenticated Sites workflow to publish to that project; do not invent credentials, create another site, or silently migrate hosting. If Sites tools are unavailable in Claude, return a change summary and direct the owner to the Codex publishing prompt in `START-HERE.md`.
