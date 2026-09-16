# HireMeow

Thailand career companion for international students and graduates: visa guidance chat, Meow Lab (resume roast, mock interviews, skill quests, culture match) and a live hiring platform on Supabase.

- **Frontend:** static files in `public/` (React runtime from the original bundle + readable modules in `public/assets/`).
- **API:** `server/app.js`, served by `api/router.js` on Vercel and by `scripts/dev.mjs` locally.
- **Database, auth, storage:** Supabase (`supabase/schema.sql`, `supabase/seed.sql`).
- **Payments:** Stripe Checkout in test mode (Meow Pool access).
- **No npm install needed.** Supabase JS and Leaflet are vendored in `public/assets/vendor/`; the server uses `fetch`.

## Live platform features

| Feature | Where | How it works |
| --- | --- | --- |
| Reverse Hiring | Companies → Reverse Hiring · My profile → Offers | Students switch on **Open to offers**. Companies browse them via `browse_open_students()` and send offers with a required salary range. Students accept or decline. |
| 1-Minute Meow Pitch | My profile | Record (max 60 s) or upload a video to the private `pitch-videos` bucket. It is attached to applications and shown to companies allowed by `hm_can_view_pitch()`. |
| Salary Transparency Wall | Jobs · Companies → Jobs | Jobs without `salary_min` and `salary_max` show **Hiding Treats 🐟** and cannot be published. This is enforced by a check constraint and a trigger, not only the UI. |
| Ghosting Protection | Daily cron · Admin | Applications with no company action for 5 days (`ghosting_last_reply_at`) get a reminder in `email_outbox` (mock email), and the company's response rate is recalculated. Any company status change counts as a reply. |
| BTS/MRT filter + map | Jobs | Filter by stops from your station (BTS Sukhumvit, BTS Silom and MRT Blue starter set, with interchanges), by distance from your location, and see jobs on an OpenStreetMap map. |
| Meow Pool | Meow Pool page · Admin | Admins toggle `is_meow_pool_top50` (max 50 per month). Companies see a teaser until they pay ฿3,000 with Stripe (test mode). The webhook records `meow_pool_access`. |
| Layoff Radar | Daily cron · Admin | `company_health` (green/yellow/red) comes from a news provider. The default is a mock provider (`server/news/mock-news.js`), with a placeholder for NewsAPI. Admins can override and lock a colour. |
| Offer Timeline | My profile | Applied → Viewed → Shortlisted → Interview → Offer, from `application_events`. |

Without Supabase keys the site still works: the platform tabs show setup instructions, and the Meow Lab demo previews stay available.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query:** paste all of `supabase/schema.sql` and click **Run**. Then do the same with `supabase/seed.sql` (the BTS/MRT stations).
   This creates tables, Row Level Security policies, triggers, RPC functions and the private `pitch-videos` storage bucket. It is safe to run again.
3. **Make yourself admin:** sign up on the site first, then run:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
4. **Authentication → URL Configuration:** set **Site URL** to your production URL (for example `https://hiremeow.vercel.app`). Add `http://127.0.0.1:4278/**` and your Vercel preview URL pattern to **Redirect URLs**.
5. **Authentication → Providers → Email:** enabled by default. Keep "Confirm email" on for production.
6. **Authentication → Providers → Google:**
   - In Google Cloud Console, create an OAuth client ID (type "Web application").
   - Add the authorised redirect URI Supabase shows you (`https://<project-ref>.supabase.co/auth/v1/callback`).
   - Paste the Client ID and Client Secret into Supabase and enable the provider.
7. **Project Settings → API:** copy the Project URL, the `anon` public key and the `service_role` key for the next step.

> The `service_role` key bypasses Row Level Security. Only put it in server environment variables (`SUPABASE_SERVICE_KEY`), never in browser code.

## 2. Environment variables

Copy `.env.example` to `.env` for local development. In Vercel, set the same names under **Project → Settings → Environment Variables**.

| Name | Required | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL (sent to the browser through `/api/config`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key; RLS protects the data |
| `SUPABASE_SERVICE_KEY` | yes | Server only: Stripe webhook, cron jobs |
| `OPENAI_API_KEY` | for live AI | Chat and Meow Lab AI (signed-in users only) |
| `OPENAI_MODEL` | no | Defaults to `gpt-5-mini` |
| `STRIPE_SECRET_KEY` | for Meow Pool | `sk_test_…` (live keys are refused unless `STRIPE_ALLOW_LIVE=1`) |
| `STRIPE_WEBHOOK_SECRET` | for Meow Pool | `whsec_…` from the webhook endpoint |
| `MEOW_POOL_PRICE_THB` | no | Defaults to `3000` |
| `APP_URL` | recommended | Public URL for Stripe redirects |
| `CRON_SECRET` | yes on Vercel | Vercel Cron sends it as `Authorization: Bearer …` |
| `GHOSTING_DAYS` | no | Defaults to `5` |
| `NEWS_PROVIDER` / `NEWS_API_KEY` | no | `mock` (default) or `newsapi` |

## 3. Stripe (test mode)

1. In the Stripe Dashboard, switch on **Test mode** and copy the secret key (`sk_test_…`).
2. **Developers → Webhooks → Add endpoint:** `https://<your-domain>/api/stripe/webhook`, with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Pay with test card `4242 4242 4242 4242`, any future expiry date and any CVC.
4. **Locally:** after checkout, the success page calls `/api/stripe/confirm`, which verifies the session with Stripe, so no webhook tunnel is needed. To test the webhook anyway, run `stripe listen --forward-to 127.0.0.1:4278/api/stripe/webhook`.

## 4. Run locally

- Double-click **`Preview HireMeow.command`**. It starts the website and API at http://127.0.0.1:4278/ and opens your browser.
- Or run `npm run dev`. This needs Node.js 20.12 or newer; no `npm install`.

Other commands:

- `npm test`: API, Stripe, cron, AI, station and chat tests (all mocked, so no network or credits are used).
- `npm run test:sql`: runs `supabase/schema.sql` against a local Postgres with Supabase stubs, then checks 45 RLS and business rules. Set `PGHOST`/`PGPORT` if needed.
- `npm run cron:ghosting` / `npm run cron:health`: run the scheduled jobs against your Supabase project.
- `npm run seed:sql`: regenerate `supabase/seed.sql` after editing `public/assets/platform/stations.js`.

## 4b. AI features (Meow Agent, AI Studio, Meow Copilot)

All AI runs on the server with `OPENAI_API_KEY` (model `OPENAI_MODEL`, default `gpt-5-mini`), using the signed-in user's own Supabase token, so Row Level Security still decides what each person can see. Run `supabase/migrations/2026-09-16-ai-features.sql` once (it is also at the end of `schema.sql`).

- **Meow Agent** (`server/agent.js`, `public/assets/platform/agent.js`): floating chat for students. Finds and ranks jobs with a computed match % ("73% match because you have React… Missing: AWS"), prepares applications, profile updates and withdrawals (the student must press Confirm), tracks applications and visa expiry, checks job safety, gives salary ranges, and accepts Thai or English voice input.
- **AI Studio** for students (`public/assets/platform/studio.js`, in Meow Lab): Smart Job Match, 1-Click Resume Tailor (paste or PDF), cover letter from the job ad, Purr-fect Intro (EN + TH), Interview Simulator (voice in Chrome/Edge/Safari), Meow Score (9 lives), Roast My Resume, application tracker with follow-up drafts, salary insight, offer negotiation (EN + TH scripts), career path, fake-job detector and a public portfolio page (`/?portfolio=<slug>`).
- **Job cards**: match %, safety check, and a public 24/7 candidate chatbot (`/api/job-chat`) that answers only from the job ad and the recruiter's Candidate FAQ.
- **Meow Copilot** for companies: ✨ Write with AI in the job editor (JD + salary suggestion + FAQ), AI Screener (HireMeow applicants plus up to 500 uploaded PDF/.txt resumes, Top 20 + CSV) and Talent Pool Miner. Screening prompts exclude nationality, age, gender, religion and photos.
- Salary numbers come from published HireMeow jobs; with fewer than 3 matches the UI labels them as an AI estimate.
- `server/skills.js` holds every AI tool (`POST /api/skill {skill, input}`), each with a strict JSON schema. Tests: `tests/agent.test.mjs`, `tests/skills.test.mjs`, `supabase/test/rls-test-3.sql`.
- Not built yet (need extra accounts): paid Auto Apply / Recruiter Copilot plans (Stripe billing), LINE / WhatsApp chat, interview scheduling with real invites, video resume analysis.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository. `.env` is git-ignored.
2. In Vercel, click **Add New → Project**, import the repository and keep **Framework Preset: Other**. `vercel.json` already sets:
   - `outputDirectory: public`, with no build or install step;
   - `/api/*` → `api/router.js`, a Node.js function;
   - two daily Cron Jobs: `/api/cron/ghosting` at 02:00 UTC and `/api/cron/company-health` at 02:30 UTC.
3. Add the environment variables from step 2 and deploy.
4. Update Supabase **Site URL / Redirect URLs** and the Stripe webhook URL to the Vercel domain.
5. Test by signing up, then:
   - post a job as a company: publishing is blocked without a salary;
   - apply as a student, with a pitch attached;
   - use **Admin → Run Ghosting Protection / Run Layoff Radar**.

Vercel's Hobby plan runs Cron Jobs once a day, which is what this project uses.

## Security notes

- Every table has Row Level Security (details in `supabase/schema.sql`). Triggers stop users from:
  - making themselves admin or adding themselves to the Meow Pool;
  - faking company health or response rates;
  - pre-setting application or offer statuses.
- Pitch videos are private. Only the student, admins and eligible companies can create signed URLs.
- `/api/chat` and `/api/ai` require a Supabase session on Vercel. Client-supplied `oai-authenticated-user-*` headers are always stripped.
- Company accounts are self-serve. Before launch, consider verifying companies (for example with an admin approval flag) before they can browse students who are open to offers.
- Email is mocked (`email_outbox` + server log). Replace `deliver()` in `server/mailer.js` with Resend, SendGrid or SES to send real mail.

## Other hosting

- **OpenAI Sites** (the original deployment) still works with `npm run build` → `dist/`. That worker only serves the chat API, so the platform tabs show their setup notice there.
- **Claude-hosted copy:** a separate Claude-hosted copy uses Claude for the chat and cannot reach Supabase.
