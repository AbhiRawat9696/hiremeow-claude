# Edit HireMeow with Claude

Prepared 15 September 2026.

## Your ready-to-edit project

This folder contains HireMeow's current source, images, tests, and hosting identifier. It is a separate editing copy. Your published website continues running while you edit.

- Public website: https://careerbridge-thailand-recreated.rawatabhimanyu941.chatgpt.site
- Editing folder on this Mac: `/Users/mickey/Documents/Codex/2026-09-15/co/outputs/hiremeow-claude`
- Project instructions for Claude: `CLAUDE.md`
- Detailed file map and hosting information: `TECHNICAL-HANDOFF.md`
- Ready-to-use requests: `PROMPTS.md`

## New: full-stack HireMeow (Supabase + Vercel)

This folder now contains a real hiring platform. Follow `README.md` (sections 1–5) to create the Supabase database, add your keys to `.env`, preview locally, and deploy to Vercel.

## 1. Open it in Claude

In Claude Desktop, choose **Code → Local → Select folder** and select this folder. Claude Code reads the included `CLAUDE.md` for project context. The Code interface edits local project files; the ordinary Chat interface does not automatically edit this folder. [Claude Desktop setup](https://code.claude.com/docs/en/desktop-quickstart), [Project instructions](https://code.claude.com/docs/en/memory).

The desktop app is already installed and signed in on this Mac. No separate Claude CLI installation is needed for the Code interface. Account access and usage limits still apply.

## 2. Tell Claude what to change

Use the first prompt in `PROMPTS.md`, replacing the bracketed line with your actual request. For example: “Make the homepage more professional, keep the Siamese cat theme, and improve the mobile navigation.”

The website can continue using OpenAI for its chat assistant while Claude edits its code. Changing editors does not require changing the website's AI provider.

## 3. Preview your edits

Double-click `Preview HireMeow.command` in Finder, or ask Claude to run `bash 'Preview HireMeow.command'`. Open http://127.0.0.1:4278/ after the terminal says the preview is ready. Keep the terminal open; press Control+C to stop it.

This launcher builds the app and uses Node.js already available on this Mac. On another computer, install Node.js 24 or newer, then use `npm run build` followed by `npm run dev`. No third-party package installation is required by this project.

The preview intentionally contains no API key. Layout, tools, saved chat guidance, and mocked API tests work without one. The published site's OpenAI secret remains configured in hosting. Live local AI requires a separately approved private environment setup; never paste the key into Claude or upload it as project knowledge.

If port 4278 is busy, stop the other HireMeow preview first. Do not run both copies' preview servers at the same time. Rebuild and restart after editing the server or HTML.

## 4. Check the result

Double-click `Check HireMeow.command`, or ask Claude to run it. It runs the existing tests and builds the site. Also review the homepage, mobile layout, navigation, career chat, resume checker, employer filters, and dashboards in the browser.

## 5. Update the existing public website

Local edits do not automatically update the public link. Publishing uses the existing OpenAI Sites project and its authenticated hosting connection.

When your changes are ready, return to this Codex task and paste:

> Publish my Claude edits from `/Users/mickey/Documents/Codex/2026-09-15/co/outputs/hiremeow-claude` to the existing HireMeow website. Review the diff against the handoff baseline, run appropriate checks, and publish to the existing public URL. Keep the existing Sites project, OpenAI runtime secret, and public access. Do not create another website.

This handoff does not install or authenticate a Sites publishing connector inside Claude. Claude can edit and preview the files immediately. If it has a supported authenticated Sites connection later, follow that connection's documented publishing workflow; the project ID alone is not publishing authorization or a credential.

## What is included

- Editable HTML, CSS, and JavaScript modules; the cat artwork and employer data.
- Cloudflare Worker code for OpenAI chat and web search.
- Build and preview scripts, and the existing automated tests.
- Persistent Claude instructions, architecture notes, prompts, and verification results.
- The existing Sites project identifier, which is not a secret.

The original application includes a compiled React bundle. The newer HireMeow layout and chat modules are readable source; the original uncompiled React/TSX project is unavailable. See the file map before asking Claude for deep changes to older tools.

The zip is a portable source snapshot. Your later edits happen in the selected folder; the zip will not update automatically.
