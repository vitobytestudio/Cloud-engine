#!/usr/bin/env bash
# ——— نشر مِرسال إلى Cloudflare — بلا تفاعل، آمن للسجلات ———
# القيم السرية لا تُطبع أبداً: تُقرأ من بيئة التنفيذ (GitHub Actions secrets)
# أو تُولَّد صامتة. من يريد التحكم بالقيم يضعها أسراراً في GitHub ثم يعيد التشغيل.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\033[1;32m▸\033[0m %s\n' "$1"; }
fail() { printf '\033[1;33m✗ %s\033[0m\n' "$1"; echo "::error::$1"; exit 1; }
# أي فشل غير متوقع يصل كملاحظة فحص قابلة للقراءة (القيم السرية لا تُطبع أبداً)
trap 'echo "::error::فشل النشر عند السطر $1 — راجع الخطوة السابقة في السجل"; exit 1' ERR

command -v npx >/dev/null || fail "node/npm مطلوب"
command -v python3 >/dev/null || fail "python3 مطلوب"
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || fail "سر CLOUDFLARE_API_TOKEN غير مضبوط في المستودع — أضفه من Settings → Secrets and variables → Actions"

# ——— 1/6 قاعدة البيانات D1 ———
step "1/6 قاعدة البيانات D1 (mirsal-db)"
DB_ID=$(npx wrangler d1 list --json 2>/dev/null | python3 -c "
import json, sys
try:
    print(next((d['uuid'] for d in json.load(sys.stdin) if d.get('name') == 'mirsal-db'), ''))
except Exception:
    print('')")
if [ -z "$DB_ID" ]; then
  OUT=$(npx wrangler d1 create mirsal-db)
  DB_ID=$(printf '%s' "$OUT" | grep -oE '[a-f0-9]{32}' | head -1)
  [ -n "$DB_ID" ] || fail "تعذر إنشاء قاعدة D1"
fi
python3 - "$DB_ID" << 'PY'
import pathlib, re, sys
p = pathlib.Path("wrangler.toml")
t = p.read_text(encoding="utf-8")
t = re.sub(r'(database_id = ")[^"]*(")', r'\g<1>' + sys.argv[1] + r'\g<2>', t)
p.write_text(t, encoding="utf-8")
PY
echo "  D1 جاهزة"

# ——— 2/6 تخزين R2 ———
step "2/6 تخزين الوصولات R2 (mirsal-receipts)"
npx wrangler r2 bucket list 2>/dev/null | grep -q "mirsal-receipts" || npx wrangler r2 bucket create mirsal-receipts
echo "  R2 جاهز"

# ——— 3/6 مساحة KV ———
step "3/6 مساحة KV (حدود المعدل والأقفال)"
KV_ID=$(npx wrangler kv namespace list 2>/dev/null | python3 -c "
import json, sys
try:
    print(next((n['id'] for n in json.load(sys.stdin) if n.get('title', '').endswith(' KV')), ''))
except Exception:
    print('')")
if [ -z "$KV_ID" ]; then
  OUT=$(npx wrangler kv namespace create KV)
  KV_ID=$(printf '%s' "$OUT" | grep -oE '[a-f0-9]{32}' | head -1)
  [ -n "$KV_ID" ] || fail "تعذر إنشاء KV"
fi
python3 - "$KV_ID" << 'PY'
import pathlib, re, sys
p = pathlib.Path("wrangler.toml")
t = p.read_text(encoding="utf-8")
t = re.sub(r'(kv_namespaces[\s\S]*?id = ")[^"]*(")', r'\g<1>' + sys.argv[1] + r'\g<2>', t, count=1)
p.write_text(t, encoding="utf-8")
PY
echo "  KV جاهزة"

# ——— 4/6 ترحيلات المخطط ———
step "4/6 تطبيق ترحيلات قاعدة البيانات"
npx wrangler d1 migrations apply mirsal-db --remote

# ——— 5/6 نشر العامل (قبل الأسرار — الأسرار تحتاج عاملاً منشوراً) ———
step "5/6 نشر العامل والواجهة"
DEPLOY_OUT=$(npx wrangler deploy)
printf '%s\n' "$DEPLOY_OUT" | grep -E "Version|Uploaded|Published|workers\.dev|Current Version" || printf '%s\n' "$DEPLOY_OUT" | tail -6

# ——— 6/6 الأسرار (قيمها لا تُطبع في أي سجل) ———
step "6/6 أسرار الإنتاج"
has_secret() { npx wrangler secret list 2>/dev/null | grep -q "\"$1\""; }
put_secret() { printf '%s' "$2" | npx wrangler secret put "$1" >/dev/null 2>&1; }

KEY="${RECEIPT_ENCRYPTION_KEY:-}"
if [ -n "$KEY" ]; then
  put_secret RECEIPT_ENCRYPTION_KEY "$KEY"; echo "  مفتاح تشفير الوصولات: من الأسرار الموفَّرة"
elif has_secret RECEIPT_ENCRYPTION_KEY; then
  echo "  مفتاح تشفير الوصولات: موجود — لم يُمَس"
else
  put_secret RECEIPT_ENCRYPTION_KEY "$(openssl rand -hex 32)"
  echo "  مفتاح تشفير الوصولات: وُلِّد صامتاً — ضع RECEIPT_ENCRYPTION_KEY كسراً في GitHub للتحكم الكامل به"
fi

INGEST="${INGEST_TOKEN:-}"
if [ -n "$INGEST" ]; then
  put_secret INGEST_TOKEN "$INGEST"; echo "  رمز استقبال الزبائن: من الأسرار الموفَّرة"
elif has_secret INGEST_TOKEN; then
  echo "  رمز استقبال الزبائن: موجود — لم يُمَس"
else
  put_secret INGEST_TOKEN "$(openssl rand -hex 24)"
  echo "  رمز استقبال الزبائن: وُلِّد صامتاً — ضع INGEST_TOKEN كسراً في GitHub وأعد التشغيل لتستعمله مع الموصلات"
fi

ADMIN="${ADMIN_EMAIL:-admin@mirsal.dz}"
if ! has_secret ADMIN_EMAIL || [ -n "${ADMIN_EMAIL:-}" ]; then
  put_secret ADMIN_EMAIL "$ADMIN"
fi
echo "  بريد المدير: $ADMIN (سجّل به ليظهر لك دور الإدارة)"

URL=$(printf '%s' "$DEPLOY_OUT" | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1 || true)
echo
step "تم نشر مِرسال بنجاح"
if [ -n "$URL" ]; then
  echo "  الرابط: $URL"
  echo "::notice::تم نشر مِرسال — الرابط: $URL"
fi
echo "  حماية الوصولات: AES-256-GCM — استقبال الزبائن: POST {الرابط}/api/ingest مع ترويسة X-Ingest-Token"
