#!/usr/bin/env bash
# تشغيل OpenHands عند كل فتح للCodespace — الرابط الرسمي من المنفذ 3000
set -euo pipefail
if [ ! -d "$HOME/openhands-ui/frontend/dist" ]; then
  echo "الإعداد الأولي لم يكتمل — شغّل: bash .devcontainer/setup-openhands.sh"
  exit 0
fi
nohup "$HOME/.venvs/oh/bin/python" "$HOME/openhands-ui/serve.py" > "$HOME/openhands.log" 2>&1 &
echo "▸ OpenHands يعمل — انتظر ثوانٍ ثم افتح المنفذ 3000 (الرابط الرسمي للمساحة)."
echo "▸ السجل: ~/openhands.log"
