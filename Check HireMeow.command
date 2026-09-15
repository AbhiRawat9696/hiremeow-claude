#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
hiremeow_node="$(command -v node || true)"
if [ -z "$hiremeow_node" ]; then
  hiremeow_node="/Users/mickey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$hiremeow_node" ]; then
  echo "Install Node.js 20.12 or newer, then run this launcher again."
  exit 1
fi
"$hiremeow_node" --test tests/*.test.mjs
"$hiremeow_node" scripts/build.mjs
echo "HireMeow checks and build passed."
