#!/usr/bin/env bash
# ——— نشر مِرسال إلى Cloudflare (إنتاج حقيقي) ———
# يشترط: حساب Cloudflare + توكن API بصلاحيات (Workers, D1, R2, KV, Secrets)
#   export CLOUDFLARE_API_TOKEN=...   (أو: npx wrangler login)
set -euo pipefail
cd "$(dirname "$0")/.."

BOLD="\033[1m"; OK="\033[32m"; WARN="\033[33m"; RESET="\033[0m"
step() { echo -e "${BOLD}${OK}▸${RESET} $1"; }
fail() { echo -e "${WARN}✗ $1${RESET}"; exit 1; }

command -v npx >/dev/null || fail "node/npm مطلوب"
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || { echo -e "${WARN}لا يوجد CLOUDFLARE_API_TOKEN — سيفتح المتصفح لتسجيل الدخول${RESET}"; }

step "1/6 إنشاء قاعدة D1 (mirsal-db) إن لم تكن"
DB_ID=$(npx wrangler d1 list --json 2>/dev/null | python3 -c "
import json,sys
try:
    dbs = json.load(sys.stdin)
    print(next((d['uuid'] for d in dbs if d['name']=='mirsal-db'), ''))
except Exception:
    print('')
")
if [ -z "$DB_ID" ]; then
  OUT=$(npx wrangler d1 create mirsal-db)
  DB_ID=$(echo "$OUT" | grep -oE 'database_id = "[a-f0-9-]+"' | head -1 | cut -d'"' -f2)
  [ -n "$DB_ID" ] || fail "تعذر إنشاء D1"
fi
python3 - "$DB_ID" << 'PY'
import pathlib, sys
p = pathlib.Path("wrangler.toml")
t = p.read_text(encoding="utf-8")
db_id = sys.argv[1]
t = re.sub(r'(database_id = ")[^"]*(")', r'\g<1>' + db_id + r'\g<2>', t)
p.write_text(t, encoding="utf-8")
PY
echo "  D1: $DB_ID"

step "2/6 إنشاء حاوية R2 (mirsal-receipts)"
npx wrangler r2 bucket list 2>/dev/null | grep -q "mirsal-receipts" || npx wrangler r2 bucket create mirsal-receipts

step "3/6 إنشاء مساحة KV"
KV_ID=$(npx wrangler kv namespace list 2>/dev/null | python3 -c "
import json,sys
try:
    ns = json.load(sys.stdin)
    print(next((n['id'] for n in ns if n['title'].endswith('KV')), ''))
except Exception:
    print('')
")
if [ -z "$KV_ID" ]; then
  OUT=$(npx wrangler kv namespace create KV)
  KV_ID=$(echo "$OUT" | grep -oE 'id = "[a-f0-9]+"' | head -1 | cut -d'"' -f2)
fi
python3 - "$KV_ID" << 'PY'
import pathlib, re, sys
p = pathlib.Path("wrangler.toml")
t = p.read_text(encoding="utf-8")
t = re.sub(r'(kv_namespaces[\s\S]*?id = ")[^"]*(")', r'\g<1>' + sys.argv[1] + r'\g<2>', t, count=1)
p.write_text(t, encoding="utf-8")
PY
echo "  KV: $KV_ID"

step "4/6 تطبيق الترحيلات على D1 البعيد"
npx wrangler d1 migrations apply mirsal-db --remote

step "5/6 الأسرار (توليد آمن إن لم تُحدد)"
if ! npx wrangler secret list 2>/dev/null | grep -q RECEIPT_ENCRYPTION_KEY; then
  openssl rand -hex 32 | npx wrangler secret put RECEIPT_ENCRYPTION_KEY
fi
if ! npx wrangler secret list 2>/dev/null | grep -q INGEST_TOKEN; then
  openssl rand -hex 24 | npx wrangler secret put INGEST_TOKEN
fi
if ! npx wrangler secret list 2>/dev/null | grep -q ADMIN_EMAIL; then
  read -rp "بريد المدير (التسجيل بهذا البريد يمنح صلاحية الإدارة): " ADMIN_MAIL
  [ -n "$ADMIN_MAIL" ] || fail "بريد المدير إلزامي"
  echo "$ADMIN_MAIL" | npx wrangler secret put ADMIN_EMAIL
fi

step "6/6 النشر"
npx wrangler deploy

URL=$(npx wrangler deployments list 2>/dev/null | grep -oE 'https://[a-z0-9-]+\.workers\.dev' | head -1 || true)
echo
echo -e "${OK}${BOLD}تم نشر مِرسال بنجاح${RESET}"
[ -n "$URL" ] && echo "  الرابط: $URL"
echo "  الخطوات الأولى: سجّل بحساب بريد المدير لتظهر لك لوحة الإدارة."
echo "  استقبال الزبائن: POST {URL}/api/ingest مع ترويسة X-Ingest-Token (الرمز الذي وضعتَه في الخطوة 5)."
