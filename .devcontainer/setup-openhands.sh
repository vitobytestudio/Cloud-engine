#!/usr/bin/env bash
# إعداد OpenHands الكامل داخل Codespace (يُنفَّذ مرة عند الإنشاء)
set -euo pipefail
echo "▸ إنشاء البيئة الافتراضية…"
python3 -m venv "$HOME/.venvs/oh"
PIP="$HOME/.venvs/oh/bin/pip"
"$PIP" install -q --upgrade pip
"$PIP" install -q "e2b==0.17.2a40"
"$PIP" install -q openhands-ai
# إصدار FastAPI المتوافق مع openhands 0.9.x (الأحدث حذف app.route)
"$PIP" install -q "fastapi==0.115.12"

echo "▸ بناء الواجهة الرسمية المطابقة للإصدار…"
OHV="$("$HOME/.venvs/oh/bin/python" -c "import importlib.metadata as m; print(m.version('openhands-ai'))")"
curl -sL -o /tmp/oh.tar.gz "https://codeload.github.com/All-Hands-AI/OpenHands/tar.gz/refs/tags/${OHV}"
mkdir -p /tmp/ohsrc && tar -xzf /tmp/oh.tar.gz -C /tmp/ohsrc
cd "/tmp/ohsrc/OpenHands-${OHV}/frontend"
npm ci --no-audit --no-fund --silent
npm run build --silent

mkdir -p "$HOME/openhands-ui/frontend" "$HOME/workspace"
cp -r dist "$HOME/openhands-ui/frontend/"
cp "$GITHUB_WORKSPACE/.devcontainer/serve.py" "$HOME/openhands-ui/serve.py"

echo "▸ جاهز — OpenHands ${OHV} مثبت والواجهة مبنية."
