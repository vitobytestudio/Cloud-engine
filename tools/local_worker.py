#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NEXUS Bridge — العامل المحلي (يعمل على جهازك أنت فقط)
═══════════════════════════════════════════════════════════════════
الفكرة: المستودع صندوق بريد بينك وبين الوكيل في Arena.

  1) الوكيل يجهز المهمة ويكتبها في tasks/request.json ويدفعها للفرع.
  2) أنت تشغّل هذا السكربت في جهازك: يفتح نافذة كروم خاصة بالجسر
     (ملف تعريف مستقل ~/.nexus-bridge-chrome)، وتسجّل دخولك بيدك
     مرة واحدة داخلها إن أردت — وكل تنفيذ يجري أمام عينك.
  3) النتائج (صور/نصوص) تُرفع إلى assets/ وتُحدَّث tasks/response.json،
     فيسحبها الوكيل من الفرع ويركّبها في NEXUS.

مهم: هذا العامل لا يعمل على خوادم GitHub أبداً — الجلسة جهازك
وشبكتك وعينك عليه. وأتمتة حسابك الشخصي في أي منصة مسؤوليتك أنت:
اقرأ شروط الخدمة، واستعمل أدواتك بنفسك وبإشرافك.

الإعداد (مرة واحدة):
  pip install playwright
  python -m playwright install chromium

التشغيل:
  python tools/local_worker.py --worker       # مراقبة مستمرة للمهام
  python tools/local_worker.py --once         # ينفذ ما هو موجود ثم يخرج
  python tools/local_worker.py                # يطبع هذا الدليل
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASKS_DIR = ROOT / "tasks"
ASSETS_DIR = ROOT / "assets"
REQ = TASKS_DIR / "request.json"
RESP = TASKS_DIR / "response.json"
PROFILE = Path.home() / ".nexus-bridge-chrome"
BRANCH = os.environ.get("BRIDGE_BRANCH", "main")


def sh(*args: object) -> None:
    subprocess.run([str(a) for a in args], cwd=str(ROOT), check=True,
                   capture_output=True, text=True)


def sync_pull() -> None:
    """يجلب أحدث الفرع — النسخة المخصصة للجسر فقط (تتجاهل التعديلات المحلية)."""
    sh("git", "fetch", "origin")
    sh("git", "reset", "--hard", f"origin/{BRANCH}")


def load(path: Path, default: object) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def connect():
    """نافذة كروم حقيقية مرئية بملف تعريف دائم خاص بالجسر."""
    from playwright.sync_api import sync_playwright
    pw = sync_playwright().start()
    try:
        ctx = pw.chromium.launch_persistent_context(
            str(PROFILE), headless=False, channel="chrome",
            viewport=None, args=["--start-maximized"])
        print("▌ نافذة كروم (النسخة المثبتة عندك) تعمل.")
    except Exception:
        ctx = pw.chromium.launch_persistent_context(
            str(PROFILE), headless=False, viewport=None,
            args=["--start-maximized"])
        print("▌ نافذة كروم (نسخة Playwright المدمجة) تعمل.")
    return pw, ctx


def execute(ctx, task: dict, outdir: Path) -> dict:
    """ينفذ مهمة واحدة. أنواع مدعومة: screenshot / extract / chat."""
    page = ctx.new_page()
    try:
        act = task["action"]
        page.goto(task["url"], wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(task.get("wait_ms", 5000))
        files: list[str] = []
        extra: dict = {}

        if act == "screenshot":
            page.screenshot(path=str(outdir / "shot.png"),
                            full_page=bool(task.get("full", False)))
            files.append("shot.png")

        elif act == "extract":
            text = page.inner_text("body")[: int(task.get("max_chars", 20000))]
            (outdir / "text.txt").write_text(text, encoding="utf-8")
            files.append("text.txt")
            extra["preview"] = text[:400]

        elif act == "chat":
            sel = task.get("input_selector", "textarea")
            page.fill(sel, task["message"])
            page.keyboard.press("Enter")
            page.wait_for_timeout(int(task.get("reply_ms", 25000)))
            page.screenshot(path=str(outdir / "reply.png"), full_page=True)
            text = page.inner_text("body")[: int(task.get("max_chars", 20000))]
            (outdir / "reply.txt").write_text(text, encoding="utf-8")
            files += ["reply.png", "reply.txt"]
            extra["preview"] = text[:400]

        else:
            raise ValueError(f"action غير معروفة: {act}")
        return {"ok": True, "files": files, **extra}
    finally:
        page.close()


def process(ctx, pending: list) -> None:
    results = load(RESP, [])
    if not isinstance(results, list):
        results = []
    done = {r.get("id") for r in results}
    for task in pending:
        tid = str(task.get("id") or int(time.time() * 1000))
        if tid in done:
            continue
        outdir = ASSETS_DIR / tid
        outdir.mkdir(parents=True, exist_ok=True)
        print(f"▸ تنفيذ {tid} ({task.get('action')}) — {task.get('url', '')}")
        try:
            res, status = execute(ctx, task, outdir), "done"
        except Exception as e:  # noqa: BLE001 — نعرض الخطأ للمالك لا نُخفيه
            res, status = {"ok": False, "error": str(e)[:300]}, "failed"
        results.append({"id": tid, "status": status, **res, "ts": int(time.time())})
        print(f"  ↳ {status}")
    save(RESP, results)


def publish() -> None:
    sh("git", "add", "assets", "tasks")
    sh("git", "-c", "user.name=NEXUS-Bridge", "-c", "user.email=bridge@local",
       "commit", "-m", "bridge: نتائج جديدة من العامل المحلي")
    for _ in range(3):
        try:
            sh("git", "push", "origin", f"HEAD:refs/heads/{BRANCH}")
            return
        except subprocess.CalledProcessError:
            sh("git", "pull", "--rebase", "origin", BRANCH)
    raise RuntimeError("فشل الرفع بعد 3 محاولات — تعارض في الفرع")


def main() -> None:
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("--worker", action="store_true")
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--poll", type=int, default=20)
    a = ap.parse_args()
    if not (a.worker or a.once):
        print(__doc__)
        sys.exit(0)

    print(f"▌ جسر NEXUS — عاملك المحلي (الفرع {BRANCH}). أول جلب للمهام…")
    pw, ctx = connect()
    try:
        while True:
            try:
                sync_pull()
                pending = load(REQ, [])
                if isinstance(pending, list) and pending:
                    process(ctx, pending)
                    save(REQ, [])  # أُخذت كل المهام — صندوق فارغ
                    publish()
                    print("▌ النتائج رُفعت. في انتظار مهام جديدة…")
                else:
                    print("▌ لا مهام جديدة.")
            except (subprocess.CalledProcessError, RuntimeError) as e:
                print(f"! تعذر مزامنة Git الآن: {e}")
            if a.once:
                break
            time.sleep(a.poll)
    except KeyboardInterrupt:
        print("توقف بطلبك.")
    finally:
        ctx.close()
        pw.stop()


if __name__ == "__main__":
    main()
