# HireMeow technical handoff

## Snapshot and current deployment

| Item | Value |
| --- | --- |
| Public URL | https://careerbridge-thailand-recreated.rawatabhimanyu941.chatgpt.site |
| Site title | HireMeow — Your Thailand Career Companion |
| Hosting | OpenAI Sites, Cloudflare Worker-compatible server and static assets |
| Sites project ID | `appgprj_6aa821eddf0081919489cfae1a6298ae` |
| Source baseline copied | `4ed63faeda9c3739ad338142139a9bb459c776e8` |
| Last saved source version | `appgprj_6aa821eddf0081919489cfae1a6298ae~appgver_cf8c17f7f82881919b5322c5a2504e89` |
| Successful OpenAI activation deployment | `appgdep_6aa8ce9998d88191814512c2db020c25` |
| Access | Changed to public on 15 September 2026 |
| Production environment revision | `1`, with secret `OPENAI_API_KEY` |
| Original managed checkout | `/Users/mickey/Documents/Codex/2026-09-14/https-thai-visa-and-job-mv-2` |

These IDs identify the same existing website. They confer no access by themselves. Deployment credentials and API keys are excluded from this package. This copy has no authenticated Git remote. Its local handoff commit, if present, is distinct from the original source baseline above.

## Architecture

1. `public/index.html` loads the original compiled module and CSS plus HireMeow-specific styles.
2. The original bundled React runtime and components are composed by `createHireMeowApp` in `hiremeow-app.js`.
3. Career chat attempts `/api/chat/status`, then `/api/chat`, or explicitly falls back to local saved guidance.
4. `server/worker.js` sends server-side requests to `https://api.openai.com/v1/responses` with recent bounded conversation and the system guidance. Web search is enabled with a `web_search` tool when requested by the client.
5. The build copies `public/` into `dist/client/`, embeds HTML and knowledge into `dist/server/index.js`, and copies hosting metadata into `dist/.openai/hosting.json`.

There is no npm framework scaffold, Vite source tree, SQL database, or installed OpenAI SDK. The server uses native `fetch`. The source has no third-party package dependencies, although the browser's compiled bundle includes React and related runtime code. Fonts load from Google Fonts.

## Where to edit

| Desired change | Primary files |
| --- | --- |
| Homepage text, sections, buttons, navigation | `public/assets/hiremeow-app.js` |
| Colors, typography, spacing, responsiveness | `public/assets/hiremeow.css` |
| Cat/Bangkok image | `public/assets/hiremeow-hero.png` and image reference in `hiremeow-app.js` |
| Page title, metadata, initial stylesheet/module tags | `public/index.html` |
| Chat bubbles, input, citations, guided interaction | `public/assets/career-chat.js`, `career-chat.css` |
| History length, API calling and fallback | `public/assets/hiremeow-live.js` |
| Saved answers and sources | `public/assets/career-knowledge.js` |
| Guided visa flow | `public/assets/visa-guidance.js` and relevant chat integration |
| AI instructions, model, web search, request checks | `server/worker.js` |
| Employer records | `public/assets/employers.json` |
| Legacy resume checker, employer component, languages, dashboards | `public/assets/index-C--u-fTV.js` (compiled code) |
| Original utility/component styles | `public/assets/index-wkP--EOX.css` |
| Browser icon | `public/favicon.svg` |
| Build and local preview behavior | `scripts/build.mjs`, `scripts/dev.mjs` |

For deep legacy changes, inspect the bundled component boundaries first. A future rewrite to maintainable source is possible but is a separate change requiring regression checks; the uncompiled original project cannot be recovered exactly from this package.

## API contract

### GET `/api/chat/status`

Returns `{ "available": true, "webSearch": true }` when the server has an API key. This only checks configuration, not API credit balance or upstream health.

### POST `/api/chat`

```json
{
  "messages": [{ "role": "user", "content": "How can I prepare for an interview?" }],
  "webSearch": false
}
```

Requires `Content-Type: application/json`, matching `Origin`, and a trusted `oai-authenticated-user-id` supplied by hosting. A successful response is `{ "answer": ... }` with `title`, `paragraphs`, `blocks`, `live`, `searched`, and `sources`; citation entries include `start`, `end`, `url`, and `title`.

Validation permits 1–12 messages, user/assistant roles, up to 16,000 characters each and 48,000 total, with a user message last. The server rejects oversized request bodies and uses a best-effort in-memory limit of eight requests per identity per minute. This is not a durable global spend limit. The provider request uses `store:false`, `max_output_tokens:6000`, low reasoning effort, and a 55-second timeout. UI history and provider retention are distinct.

The website is public, but live chat still requires the hosting identity header. Anonymous live-chat behavior was not verified during this handoff. Treat this as a specific behavior to test if anonymous chat is requested; do not infer it from the public access flag.

## Environment and external services

- `OPENAI_API_KEY`: already stored in production Sites as a secret; not in source or this copy.
- `OPENAI_MODEL`: optional server-only override; defaults to `gpt-5-mini`.
- OpenAI supplies the website's AI; Claude is the development editor.
- Local `.env` is optional and ignored; `.env.example` contains placeholders only.
- Local layout, saved guidance, and mocked tests work without credentials.
- No live Google Sheets, recruitment database, or application submission integration is configured.

Do not copy the original checkout's `.env` into an archive or Claude upload. If local live-AI testing becomes necessary, arrange a separately approved private setup.

## Test and preview workflow

Use Node.js 24+:

```sh
npm test
npm run build
npm run dev
```

The Mac launchers also work when Node is missing from shell PATH by using the existing bundled runtime. The preview URL is `http://127.0.0.1:4278/`. Restart after rebuilding server or HTML changes. Tests cover saved topic matching and routes, origin/identity validation, conversation bounds, provider failures, citations, and web-search settings. They use mock provider responses and do not consume OpenAI credits.

The activation work on 15 September 2026 separately received a real `200`/`OK` from OpenAI and a real chat-handler web search with one source citation. Those were provider/handler tests, not an anonymous visitor production UI test.

## Publish changes to the same URL

Use the Codex publishing prompt in `START-HERE.md`. The publishing agent should review this copy's changes against the supplied baseline and reconcile them with the managed checkout before publishing. Avoid parallel edits to the two copies. Copy only intended source changes, never `.env`, `.git`, machine-specific launcher files, or generated/stale artifacts indiscriminately.

Preserve the existing project ID, public audience, and production secret. Rebuild when source changes, push the exact intended source through the authenticated Sites workflow, save the corresponding version, deploy for the public audience, and verify deployment success. The previous private-only deployment action is no longer appropriate now that the site is public. An unchanged source version can be reused only when its source and archive actually match.

## Known limitations and cleanup candidates

- Legacy components are compiled; this is not the original Bolt/React source repository.
- Employer records and university/HR dashboards are demonstrations. Sponsorship is not guaranteed.
- Resume feedback is browser-only heuristic feedback, separate from live chat.
- `public/index.html` still references the original Bolt social-preview image; change it when requested.
- Some copy is English-only despite the inherited language picker; verify the specific language experience when editing it.
- The existing upstream rate limit is best effort. Public visibility does not prove anonymous live chat works.

## Official references

- Claude Desktop: https://code.claude.com/docs/en/desktop-quickstart
- Claude project instructions: https://code.claude.com/docs/en/memory
- Claude desktop links: https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link


## Update 15 September 2026: full-stack platform (Claude)

- Added Supabase (auth: email, magic link, Google; Postgres with RLS; private `pitch-videos` storage) and a Vercel deployment (`vercel.json`, `api/router.js`).
- New real features: Reverse Hiring, 1-Minute Meow Pitch uploads, Salary Transparency Wall (DB-enforced), Ghosting Protection (daily cron, mock email, response rates), BTS/MRT filter with Leaflet map, Meow Pool with Stripe test-mode checkout and webhook, Layoff Radar (company_health with mock news provider and cron), live Offer Timeline.
- Meow Lab (MeowScore, mock interview, Skill Quests, MeowMatch DNA) now uses `/api/ai` (OpenAI, signed-in users) and syncs results to the profile.
- Environment variables: `.env.example`. Setup and deploy: `README.md`.
- Tests: `npm test` (18 mocked API tests) and `npm run test:sql` (45 database/RLS checks). Browser flows were exercised against PostgREST + a fake auth/storage gateway; real Supabase Auth emails, Google OAuth, Storage and Stripe were not exercised and need a live check after setup.
- The Sites worker in `server/worker.js` is unchanged; on Sites the new platform tabs show a setup notice.
