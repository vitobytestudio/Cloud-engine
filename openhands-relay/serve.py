# تشغيل خادم OpenHands الرسمي — الاستيراد داخل حلقة الأحداث (متطلب SessionManager)
import asyncio
import os
import uvicorn


async def main():
    from openhands.server.listen import app  # noqa: E402 — عمداً داخل الحلقة

    config = uvicorn.Config(app, host="0.0.0.0", port=3000, loop="asyncio", log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


os.environ.setdefault(
    "LLM_MODEL", "gemini/gemini-2.0-flash" if os.environ.get("GEMINI_API_KEY") else "litellm_mock"
)
os.environ.setdefault("LLM_API_KEY", os.environ.get("GEMINI_API_KEY", "mock-key"))
os.environ.setdefault("WORKSPACE_BASE", os.path.expanduser("~/workspace"))
os.environ.setdefault("RUN_AS_OPENHANDS", "false")
os.environ.setdefault("FILE_STORE", "local")
os.environ.setdefault("FILE_STORE_PATH", os.path.expanduser("~/workspace/.files"))
os.environ.setdefault("RUNTIME", "local")

asyncio.run(main())
