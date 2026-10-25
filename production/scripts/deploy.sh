#!/usr/bin/env bash
# ——— نشر مِرسال إلى Cloudflare — بلا تفاعل، آمن للسجلات ———
# القيم السرية لا تُطبع أبداً: تُقرأ من أسرار GitHub أو تُولَّد صامتة.
# رسائل أخطاء Cloudflare (أكواد/معرفات فقط) تصل كملاحظات فحص للتشخيص.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\033[1;32m▸\033[0m %s\n' "$1"; }
fail() { printf '\033[1;33m✗ %s\033[0m\n' "$1"; echo "::error::$1"; exit 1; }
# يُبلّغ نص خطأ الأمر (بلا أسرار) ثم يخرج
fail2() { printf '\033[1;33m✗ %s\033[0m\n' "$2"; echo "::error::$2"; printf '%s\n' "${1:-}" | tail -6 | while IFS= read -r l; do [ -n "$l" ] && echo "::error::↳ $l"; done; exit 1; }
# أي أمر يفشل دون قُدرة: يُبلّغ رقم السطر والرمز (الأسرار مقنعة آلياً في السجلات)
trap 'rc=$?; echo "::error::فشل غير معلوم — السطر $1 (رمز $rc)"; exit $rc' ERR

command -v npx >/dev/null || fail "node/npm مطلوب"
command -v python3 >/dev/null || fail "python3 مطلوب"
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || fail "سر CLOUDFLARE_API_TOKEN غير مضبوط في المستودع — أضفه من Settings → Secrets and variables → Actions"

# إن كان متغير الحساب فارغاً نُسقطه حتى لا يربك wrangler
[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || unset CLOUDFLARE_ACCOUNT_ID 2>/dev/null || true

# ——— 0/6 صلاحية التوكن ———
WHOAMI=$(npx wrangler whoami 2>&1) || fail2 "$WHOAMI" "التوكن مرفوض من Cloudflare"
echo "::notice::0-التوكن صالح"

# تحديد الحساب: من السر إن وُجد، وإلا مطابقة اسمه (vitobytestudio)، وإلا الوحيد إن كان واحداً
if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  ACC_JSON=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" https://api.cloudflare.com/client/v4/accounts || true)
  CLOUDFLARE_ACCOUNT_ID=$(printf '%s' "$ACC_JSON" | python3 -c "
import json, sys
try:
    accs = json.load(sys.stdin).get('result') or []
    m = [a['id'] for a in accs if 'vito' in (a.get('name') or '').lower()]
    if len(m) >= 1: print(m[0])
    elif len(accs) == 1: print(accs[0]['id'])
    else: print('')
except Exception:
    print('')")
  if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
    export CLOUDFLARE_ACCOUNT_ID
    echo "::notice::الحساب المحدد: $CLOUDFLARE_ACCOUNT_ID"
  fi
fi
[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || fail "تعذر تحديد الحساب آلياً — أضف سراً باسم CLOUDFLARE_ACCOUNT_ID (معرفه من dash.cloudflare.com)"

# ——— 1/5 قاعدة البيانات D1 ———
step "1/5 قاعدة البيانات D1 (mirsal-db)"
D1_OUT=$(npx wrangler d1 list --json 2>&1) || fail2 "$D1_OUT" "فشل قراءة قوائم D1 — راجع صلاحية D1 في التوكن"
DB_ID=$(printf '%s' "$D1_OUT" | python3 -c "
import json, sys
try:
    print(next((d['uuid'] for d in json.load(sys.stdin) if d.get('name') == 'mirsal-db'), ''))
except Exception:
    print('')")
if [ -z "$DB_ID" ]; then
  OUT=$(npx wrangler d1 create mirsal-db 2>&1) || fail2 "$OUT" "تعذر إنشاء قاعدة D1"
  DB_ID=$(printf '%s' "$OUT" | grep -oE '[a-f0-9]{32}' | head -1)
  [ -n "$DB_ID" ] || fail "أُنشئت D1 لكن تعذر استخراج معرفها"
fi
python3 - "$DB_ID" << 'PY'
import pathlib, re, sys
p = pathlib.Path("wrangler.toml")
t = p.read_text(encoding="utf-8")
t = re.sub(r'(database_id = ")[^"]*(")', r'\g<1>' + sys.argv[1] + r'\g<2>', t)
p.write_text(t, encoding="utf-8")
PY
echo "::notice::1-D1 ok ($DB_ID)"

# ——— 2/5 مساحة KV ———
step "2/5 مساحة KV (حدود المعدل والأقفال)"
KV_OUT=$(npx wrangler kv namespace list 2>&1) || fail2 "$KV_OUT" "فشل قراءة مساحات KV — راجع صلاحية KV في التوكن"
KV_ID=$(printf '%s' "$KV_OUT" | python3 -c "
import json, sys
try:
    print(next((n['id'] for n in json.load(sys.stdin) if 'kv' in n.get('title', '').lower()), ''))
except Exception:
    print('')")
if [ -z "$KV_ID" ]; then
  OUT=$(npx wrangler kv namespace create KV 2>&1) || fail2 "$OUT" "تعذر إنشاء مساحة KV"
  KV_ID=$(printf '%s' "$OUT" | grep -oE '[a-f0-9]{32}' | head -1)
  [ -n "$KV_ID" ] || fail "أُنشئت KV لكن تعذر استخراج معرفها"
fi
python3 - "$KV_ID" << 'PY'
import pathlib, re, sys
p = pathlib.Path("wrangler.toml")
t = p.read_text(encoding="utf-8")
t = re.sub(r'(kv_namespaces[\s\S]*?id = ")[^"]*(")', r'\g<1>' + sys.argv[1] + r'\g<2>', t, count=1)
p.write_text(t, encoding="utf-8")
PY
echo "::notice::2-KV ok ($KV_ID)"

# ——— 3/5 ترحيلات المخطط ———
step "4/6 تطبيق ترحيلات قاعدة البيانات"
MIG_OUT=$(npx wrangler d1 migrations apply mirsal-db --remote 2>&1) || fail2 "$MIG_OUT" "فشل تطبيق الترحيلات"
echo "::notice::3-migrations ok"

# ——— 4/5 نشر العامل ———
step "4/5 نشر العامل والواجهة"
DEPLOY_OUT=$(npx wrangler deploy 2>&1) || fail2 "$DEPLOY_OUT" "فشل نشر العامل"
printf '%s\n' "$DEPLOY_OUT" | grep -E "Version|Uploaded|Published|workers\.dev|Current Version" || printf '%s\n' "$DEPLOY_OUT" | tail -6
echo "::notice::4-worker-deployed"

# ——— 5/5 الأسرار ———
step "6/6 أسرار الإنتاج"
has_secret() { npx wrangler secret list 2>&1 | grep -q "\"$1\""; }
put_secret() { local out; out=$(printf '%s' "$2" | npx wrangler secret put "$1" 2>&1) || fail2 "$out" "فشل ضبط السر $1"; }

KEY="${RECEIPT_ENCRYPTION_KEY:-}"
if [ -n "$KEY" ]; then
  put_secret RECEIPT_ENCRYPTION_KEY "$KEY"; echo "  مفتاح تشفير الوصولات: من الأسرار الموفَّرة"
elif has_secret RECEIPT_ENCRYPTION_KEY; then
  echo "  مفتاح تشفير الوصولات: موجود — لم يُمَس"
else
  put_secret RECEIPT_ENCRYPTION_KEY "$(openssl rand -hex 32)"
  echo "  مفتاح تشفير الوصولات: وُلِّد صامتاً"
fi

INGEST="${INGEST_TOKEN:-}"
if [ -n "$INGEST" ]; then
  put_secret INGEST_TOKEN "$INGEST"; echo "  رمز استقبال الزبائن: من الأسرار الموفَّرة"
elif has_secret INGEST_TOKEN; then
  echo "  رمز استقبال الزبائن: موجود — لم يُمَس"
else
  put_secret INGEST_TOKEN "$(openssl rand -hex 24)"
  echo "  رمز استقبال الزبائن: وُلِّد صامتاً"
fi

ADMIN="${ADMIN_EMAIL:-admin@mirsal.dz}"
if ! has_secret ADMIN_EMAIL || [ -n "${ADMIN_EMAIL:-}" ]; then
  put_secret ADMIN_EMAIL "$ADMIN"
fi
echo "  بريد المدير: $ADMIN"

URL=$(printf '%s' "$DEPLOY_OUT" | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1 || true)
echo
step "تم نشر مِرسال بنجاح"
if [ -n "$URL" ]; then
  echo "  الرابط: $URL"
  echo "::notice::تم نشر مِرسال — الرابط: $URL"
else
  echo "::notice::تم النشر — راجع مخرجات wrangler لمعرفة الرابط"
fi
