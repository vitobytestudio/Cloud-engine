"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Phone, ShieldCheck, Info, MessagesSquare } from "lucide-react";
import { useJson, useLive } from "@/lib/hooks";
import { PageHeader, PlatformIcon } from "@/components/ui";
import { relTime } from "@/lib/utils";
import type { Conversation, Lead, Message, Platform } from "@/lib/types";

interface ConvItem extends Conversation {
  lead: Lead | null;
}

interface ThreadData {
  conversation: Conversation;
  lead: Lead | null;
  messages: Message[];
}

const PLATFORM_BG: Record<Platform, string> = {
  instagram: "bg-pink-600",
  facebook: "bg-blue-600",
  whatsapp: "bg-emerald-600",
  tiktok: "bg-slate-900",
  x: "bg-slate-800",
};

export default function InboxPage() {
  const { live } = useLive();
  const convs = useJson<{ conversations: ConvItem[] }>("/api/conversations", 4000);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const thread = useJson<ThreadData>(selected ? `/api/conversations/${selected}` : null, 3500);
  const bottomRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => convs.data?.conversations ?? [], [convs.data]);
  const t = thread.data;

  useEffect(() => {
    if (!selected && list.length) setSelected(list[0].id);
  }, [list, selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.messages.length, selected]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setDraft("");
    await fetch(`/api/conversations/${selected}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    convs.refresh();
    thread.refresh();
    setSending(false);
    // محاكاة رد العميل — في الإنتاج تأتي من Webhook المنصة الرسمية
    if (Math.random() < 0.6) {
      setTimeout(async () => {
        await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "message", conversationId: selected }),
        });
        convs.refresh();
        thread.refresh();
      }, 3000);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="الصندوق الموحد"
        sub="كل رسائل عملائك من كل المنصات — في مكان واحد وبزمن حقيقي"
      />

      <div className="grid h-[calc(100vh-220px)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_1fr]">
        {/* قائمة المحادثات */}
        <div className="hidden flex-col overflow-y-auto border-e border-slate-100 md:flex">
          {list.map((c) => {
            const active = c.id === selected;
            const name = c.lead?.name ?? "عميل";
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3.5 text-start transition ${
                  active ? "bg-violet-50/80" : "hover:bg-slate-50"
                }`}
              >
                <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${PLATFORM_BG[c.platform]}`}>
                  <PlatformIcon p={c.platform} className="h-4.5 w-4.5" />
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                      {c.unread}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-extrabold text-slate-800">{name}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{relTime(c.lastMessageAt)}</span>
                  </span>
                  <span className={`mt-0.5 block truncate text-[11.5px] ${c.unread ? "font-bold text-slate-700" : "text-slate-400"}`}>
                    {c.lastMessagePreview}
                  </span>
                </span>
              </button>
            );
          })}
          {!list.length && <div className="p-6 text-center text-sm text-slate-400">لا محادثات بعد</div>}
        </div>

        {/* المحادثة الحالية */}
        <div className="flex flex-col">
          {t?.lead ? (
            <>
              {/* رأس */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${PLATFORM_BG[t.conversation.platform]}`}>
                  <PlatformIcon p={t.conversation.platform} className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-extrabold text-slate-900">{t.lead.name}</div>
                  <div className="truncate text-[11px] text-slate-400">
                    {t.lead.handle || t.lead.phone || "—"} · عبر{" "}
                    {{ instagram: "إنستغرام", facebook: "فيسبوك", whatsapp: "واتساب", tiktok: "تيك توك", x: "إكس" }[t.conversation.platform]}
                  </div>
                </div>
                {t.lead.phone && (
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600 sm:flex">
                    <Phone className="h-3 w-3" />
                    {t.lead.phone}
                  </span>
                )}
                {t.lead.consent && (
                  <span className="hidden items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-600 sm:flex">
                    <ShieldCheck className="h-3 w-3" />
                    موافقة تواصل
                  </span>
                )}
              </div>

              {/* الرسائل */}
              <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50/60 px-5 py-4">
                {t.messages.map((m) => (
                  <div key={m.id} className={`pop-in flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 text-[13px] leading-6 shadow-sm ${
                        m.direction === "out"
                          ? t.conversation.platform === "whatsapp"
                            ? "rounded-2xl rounded-tl-sm bg-emerald-500 text-white"
                            : "rounded-2xl rounded-tl-sm bg-violet-600 text-white"
                          : "rounded-2xl rounded-tr-sm border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      {m.body}
                      <div className={`mt-1 text-end text-[9px] ${m.direction === "out" ? "text-white/70" : "text-slate-400"}`}>
                        {m.direction === "out" ? (m.status === "read" ? "قرأها ✓✓" : m.status === "delivered" ? "وصلت ✓✓" : "أُرسلت ✓") : relTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* الإرسال */}
              <div className="border-t border-slate-100 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-400">
                  <Info className="h-3 w-3" />
                  يُرسل عبر الواجهة الرسمية (بيئة تجريبية حالياً)
                </div>
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="اكتب ردك… (Enter للإرسال)"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 disabled:opacity-40"
                    aria-label="إرسال"
                  >
                    <Send className="h-4 w-4 -scale-x-100" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <MessagesSquare className="h-10 w-10" />
                <div className="text-sm font-bold">اختر محادثة من القائمة</div>
                <div className="text-[11px]">أو انتظر رسالة جديدة في الوضع الحي</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* قائمة المحادثات للجوال */}
      <div className="mt-3 grid grid-cols-1 gap-2 md:hidden">
        {list.slice(0, 6).map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-start ${c.id === selected ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"}`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${PLATFORM_BG[c.platform]}`}>
              <PlatformIcon p={c.platform} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-slate-800">{c.lead?.name ?? "عميل"}</span>
              <span className="block truncate text-[11px] text-slate-400">{c.lastMessagePreview}</span>
            </span>
            {c.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{c.unread}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
