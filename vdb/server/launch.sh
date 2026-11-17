#!/bin/sh
# إطلاق الإمبراطورية على أي سيرفر نملكه: sh vdb/server/launch.sh [PORT] [DATA] [TOKEN]
cd "$(dirname "$0")/.." || exit 1
PORT="${1:-8490}"
DATA="${2:-server/data}"
TOKEN="${3:-vdb-empire-dev}"
npm install --no-audit --no-fund
npx esbuild server/bundle-entry.ts --bundle --format=esm --platform=node --charset=utf8 --outfile=server/vdb.bundle.mjs
exec node server/node.mjs --port "$PORT" --data "$DATA" --token "$TOKEN"
