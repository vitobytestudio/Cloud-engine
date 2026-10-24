#!/usr/bin/env bash
# بناء النسخة الساكنة التجريبية (GitHub Pages) إلى مجلد docs/
# تُنقل مسارات API مؤقتاً خارج البناء لأن الصفحات الساكنة تعتمد طبقة shim في المتصفح
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d src/app/api ]; then
  mv src/app/api /tmp/mirsal-api-backup
  trap 'if [ -d /tmp/mirsal-api-backup ] && [ ! -d src/app/api ]; then mv /tmp/mirsal-api-backup src/app/api; fi' EXIT
else
  trap 'true' EXIT
fi

rm -rf out docs
NEXT_PUBLIC_STATIC_DEPLOY=1 npx next build

mkdir -p docs
cp -r out/. docs/
touch docs/.nojekyll

echo "✅ تم بناء النسخة الساكنة في docs/ ($(find docs -type f | wc -l) ملفاً)"
