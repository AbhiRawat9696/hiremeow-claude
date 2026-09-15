#!/bin/bash
# Starts the HireMeow full stack (website + API) at http://127.0.0.1:4278/
# Put your keys in a file named .env next to this launcher (copy .env.example).
set -euo pipefail
cd -- "$(dirname -- "$0")"
hiremeow_node="$(command -v node || true)"
if [ -z "$hiremeow_node" ]; then
  hiremeow_node="/Users/mickey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$hiremeow_node" ]; then
  echo "Install Node.js 20.12 or newer (nodejs.org), then run this launcher again."
  exit 1
fi
if [ ! -f .env ]; then
  echo "No .env file yet: the site runs in offline mode (no sign-in, jobs, payments or live AI)."
  echo "Copy .env.example to .env and fill in your Supabase keys to turn on the full platform."
fi
"$hiremeow_node" scripts/build.mjs >/dev/null
echo "Open http://127.0.0.1:4278/ once it says ready. Press Control+C to stop."
( sleep 1.5; open "http://127.0.0.1:4278/" >/dev/null 2>&1 || true ) &
exec "$hiremeow_node" scripts/dev.mjs
