const CHANNELS = [
  "Meta Graph API",
  "WhatsApp Business Platform",
  "X API v2 — Recent Search",
  "Telegram Bot API",
  "RSS Feeds",
  "Open Graph Metadata",
];

export default function ChannelMarquee() {
  const row = [...CHANNELS, ...CHANNELS];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-5">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 bg-gradient-to-l from-transparent to-[#06060b]" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 bg-gradient-to-r from-transparent to-[#06060b]" />
      <div dir="ltr" className="flex w-max marquee-track items-center gap-12">
        {row.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="flex items-center gap-3 whitespace-nowrap text-[13px] font-extrabold tracking-wide text-slate-500"
          >
            <span className="h-1 w-1 rounded-full bg-violet-400/50" />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
