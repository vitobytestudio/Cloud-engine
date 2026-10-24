import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Inbox,
  Radar,
  MessageCircle,
  FileDown,
  Users,
  ShieldCheck,
  Check,
  Instagram,
  Facebook,
  Music2,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "أتمتة «تعليق ← رسالة»",
    desc: "العميل يعلّق كلمة مثل «سعر» — يصله ردك التلقائي في الخاص خلال ثوانٍ، وتُسجَّل بياناته تلقائياً.",
  },
  {
    icon: Inbox,
    title: "صندوق موحد لحظي",
    desc: "كل رسائل وتعليقات إنستغرام وفيسبوك وواتساب وتيك توك في شاشة واحدة — دون تشتت ودون نسيان أي عميل.",
  },
  {
    icon: Radar,
    title: "مراقبة الكلمات المفتاحية",
    desc: "راقب من يبحث الآن عن منتجك في السوشيال («تجهيزات صالون»، «صالون في وهران»…) وحوّله إلى عميل فوراً.",
  },
  {
    icon: MessageCircle,
    title: "حملات واتساب رسمية",
    desc: "أرسل عروضك لعملائك عبر WhatsApp Business الرسمي — معدل فتح يتجاوز 80٪ ووصول مضمون.",
  },
  {
    icon: FileDown,
    title: "صفحات التقاط ذكية",
    desc: "رابط واحد يجمع اسم الزبون ورقمه بموافقته — في رحلة إلى لوحتك لحظياً، جاهزاً للمتابعة.",
  },
  {
    icon: Users,
    title: "CRM عربي كامل",
    desc: "ملف لكل عميل: مصدره، محادثاته، رقمه الموثّق، مؤشر اهتمامه — صفر عملاء ضائعين.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "العميل يعلّق كلمتك السرية",
    desc: "«سعر»، «حجز»، «كاتالوغ»… على أي منشور من منشوراتك.",
  },
  {
    n: "2",
    title: "يصله ردك فوراً في الخاص",
    desc: "رسالة تلقائية دافئة بأسلوبك، مع رابط العرض أو سؤال عن رقمه.",
  },
  {
    n: "3",
    title: "بيانات توصل لوحتك لحظياً",
    desc: "اسمه، حسابه، ورقمه بموافقته — وتبدأ المتابعة والبيع.",
  },
];

function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-violet-900/10">
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="mx-auto rounded-lg bg-slate-100 px-6 py-1 text-[10px] font-semibold text-slate-400">
            app.mirsal.dz/dashboard
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          <div className="rounded-2xl bg-violet-50 p-3">
            <div className="text-[10px] font-bold text-violet-500">عميل جديد اليوم</div>
            <div className="mt-1 text-2xl font-extrabold text-violet-700">+12</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <div className="text-[10px] font-bold text-emerald-500">ردود فورية</div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-600">184</div>
          </div>
          <div className="rounded-2xl bg-sky-50 p-3">
            <div className="text-[10px] font-bold text-sky-500">معدل التحويل</div>
            <div className="mt-1 text-2xl font-extrabold text-sky-600">23٪</div>
          </div>
        </div>
        <div className="space-y-2 px-4 pb-4">
          <div className="pop-in max-w-[80%] rounded-2xl rounded-tr-sm border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
            السلام عليكم، شفت منشور الميكر 👌 شحال السعر؟
          </div>
          <div className="ms-auto max-w-[80%] rounded-2xl rounded-tl-sm bg-emerald-500 px-3 py-2 text-[11px] text-white">
            وعليكم السلام أمينة 🌸 الميكر بـ 34.900 دج + توصيل 58 ولاية. نبعثلك الكاتالوغ؟
          </div>
          <div className="pop-in max-w-[80%] rounded-2xl rounded-tr-sm border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
            اه هاذا رقمي 0550 12 34 56
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2.5 text-[11px] font-bold text-white">
            <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
            عميل جديد +1 — أمينة ب. (إنستغرام ← واتساب) ✦ رقم موثّق
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 start-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-xl">
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
        <div className="text-[11px] font-extrabold text-slate-700">
          واجهات رسمية 100٪
          <span className="block text-[10px] font-semibold text-slate-400">صفر خطر حظر</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-600/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M2.4 11.1 20.8 3.2c.8-.34 1.6.44 1.3 1.26l-6 16.9c-.3.86-1.5.9-1.9.06l-2.6-5.8a1.4 1.4 0 0 0-.6-.64l-5.9-3.2c-.8-.44-.7-1.62.2-1.7Zm7.9 5.4 1.8 3.9 2.6-7.2-4.4 3.3Zm5-4.5 2.4-6.8-10.5 4.6 4.5 2.4c.3.17.55.4.74.7l.36.5 2.5-1.4Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold">مِرسال</div>
              <div className="text-[10px] font-semibold text-slate-400">استقطاب العملاء — بلا حظر</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-[13px] font-bold text-slate-500 md:flex">
            <a href="#features" className="hover:text-slate-900">المزايا</a>
            <a href="#how" className="hover:text-slate-900">كيف يعمل</a>
            <a href="#safe" className="hover:text-slate-900">الأمان</a>
            <a href="#pricing" className="hover:text-slate-900">الأسعار</a>
          </nav>
          <Link
            href="/dashboard"
            className="rounded-xl bg-violet-600 px-4 py-2 text-[13px] font-extrabold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
          >
            افتح اللوحة الحية
          </Link>
        </div>
      </header>

      {/* البطل */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 start-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl rtl:translate-x-1/2" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 lg:grid-cols-2 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[12px] font-extrabold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              مبني على الواجهات الرسمية — صفر خطر حظر
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] sm:text-5xl sm:leading-[1.2]">
              حوّل التعليقات والمتابعين إلى{" "}
              <span className="bg-gradient-to-l from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                عملاء يدفعون
              </span>{" "}
              — تلقائياً وبثوانٍ
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-8 text-slate-500">
              منصة عربية تجلب لك العملاء من إنستغرام وفيسبوك وواتساب وتيك توك: ترد عليهم فوراً،
              تجمع بياناتهم بموافقتهم، وتدير كل محادثاتك من مكان واحد — بينما أنت تبيع.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 text-[14px] font-extrabold text-white shadow-xl shadow-violet-600/30 transition hover:bg-violet-700"
              >
                جرّب اللوحة الحية الآن
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="rounded-2xl border border-slate-200 px-6 py-3.5 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-50"
              >
                كيف يعمل؟
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-bold text-slate-400">
              <span>متكامل مع:</span>
              <span className="flex items-center gap-1.5"><Instagram className="h-4 w-4 text-pink-500" /> إنستغرام</span>
              <span className="flex items-center gap-1.5"><Facebook className="h-4 w-4 text-blue-600" /> فيسبوك</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-emerald-500" /> واتساب</span>
              <span className="flex items-center gap-1.5"><Music2 className="h-4 w-4 text-slate-800" /> تيك توك</span>
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      {/* كيف يعمل */}
      <section id="how" className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black">ثلاث خطوات… والعميل يصلك وأنت مكانك</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-500">
            لا نسخ ولا لصق ولا ردود يدوية — نظّم الأتمتة مرة، ودعها تعمل 24/7.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="absolute -top-4 start-6 flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-violet-600/30">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-extrabold">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* المزايا */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black">كل ما تحتاجه لتحويل السوشيال إلى آلة مبيعات</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-600/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-7 text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الأمان */}
      <section id="safe" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[12px] font-extrabold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              الأمان أولاً
            </div>
            <h2 className="mt-4 text-3xl font-black leading-snug">
              لماذا مِرسال لا يعرّض حسابك للحظر — أبداً؟
            </h2>
            <p className="mt-4 text-[14px] leading-8 text-slate-400">
              الأدوات «الرمادية» التي تسحب الأرقام وتتحايل على الحماية تُفصح عن حسابات مستخدميها
              وتُقاضيها المنصات. نحن اخترنا الطريق الطويل والصحيح — وهو أيضاً الأكثر ربحاً.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ["واجهات رسمية 100٪", "WhatsApp Business Platform وMeta Graph API — قنوات معتمدة من المنصات نفسها."],
                ["العميل يتواصل معك أولاً", "ردّنا التلقائي يجيب من علّق أو راسلنا — لا إزعاج، لا سبام."],
                ["بيانات بموافقة صريحة", "رقم العميل يدخل نظامك لأنه أعطاه بنفسه — جودة أعلى وثقة أكبر وتحويل أعلى."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                  <div>
                    <div className="text-[14px] font-extrabold">{t}</div>
                    <div className="mt-1 text-[12.5px] leading-6 text-slate-400">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-extrabold text-slate-400">
              <Radar className="h-4 w-4 text-violet-400" />
              المقارنة بصراحة
            </div>
            <div className="space-y-3">
              {[
                ["أدوات السحب غير الرسمية", "حظر حسابات، مخاطرة قانونية، أرقام بلا موافقة لا ترد", "bg-rose-500/10 text-rose-300 border-rose-500/20", "✕"],
                ["مِرسال — الطريق الرسمي", "حسابات آمنة، بيانات موثقة بموافقة، سمعة تبني علامة تدوم", "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", "✓"],
              ].map(([title, desc, cls, mark]) => (
                <div key={title as string} className={`rounded-2xl border p-4 ${cls}`}>
                  <div className="flex items-center gap-2 text-[13px] font-black">
                    <span>{mark}</span>
                    {title}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-6 opacity-80">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* الأسعار */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black">أسعار عادلة تنمو مع عملك</h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-500">
            ابدأ مجاناً — وادفع فقط عندما تكبر مبيعاتك.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                name: "انطلاقة",
                price: "0",
                desc: "لتجربة القوة بنفسك",
                feats: ["أتمتة واحدة", "50 عميل", "صندوق موحد", "صفحة التقاط واحدة"],
                cta: "ابدأ مجاناً",
                hot: false,
              },
              {
                name: "نمو",
                price: "19",
                desc: "الأكثر اختياراً للتجار",
                feats: ["أتمتات غير محدودة", "عملاء غير محدودين", "مراقبة كلمات مفتاحية", "حملات واتساب رسمية", "تقارير لحظية"],
                cta: "جرّب 14 يوماً مجاناً",
                hot: true,
              },
              {
                name: "احتراف / وكالات",
                price: "49",
                desc: "للعلامات ووكالات التسويق",
                feats: ["كل مزايا «نمو»", "مساحات عمل متعددة", "أعضاء فريق وصلاحيات", "API وWebhooks", "مدير حساب مخصص"],
                cta: "تواصل معنا",
                hot: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl border p-7 ${
                  p.hot
                    ? "border-violet-300 bg-gradient-to-b from-violet-50 to-white shadow-xl shadow-violet-600/10"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {p.hot && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-extrabold text-white rtl:translate-x-1/2">
                    الأكثر شعبية
                  </span>
                )}
                <div className="text-[15px] font-extrabold text-slate-900">{p.name}</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-4xl font-black">${p.price}</span>
                  <span className="pb-1.5 text-[12px] font-bold text-slate-400">/ شهرياً</span>
                </div>
                <div className="mt-1 text-[12px] font-semibold text-slate-500">{p.desc}</div>
                <ul className="mt-5 space-y-2.5">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                      <Check className="h-4 w-4 shrink-0 text-violet-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`mt-6 block rounded-2xl py-3 text-center text-[13px] font-extrabold transition ${
                    p.hot
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* نداء أخير */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-violet-700 via-violet-600 to-fuchsia-600 px-8 py-14 text-center text-white shadow-2xl shadow-violet-600/30">
            <h2 className="text-3xl font-black leading-snug">كل تعليق بدون رد = عميل يذهب لمنافسك</h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-violet-100">
              فعّل مِرسال اليوم ودع كل تفاعل يتحول إلى فرصة بيع — أثناء نومك.
            </p>
            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-[14px] font-extrabold text-violet-700 shadow-xl transition hover:bg-violet-50"
            >
              افتح اللوحة الحية
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* التذييل */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-[12px] font-semibold text-slate-400">
          <div>© 2026 مِرسال — صُنع بشغف في وهران 🇩🇿</div>
          <div className="flex gap-5">
            <a href="#features" className="hover:text-slate-600">المزايا</a>
            <a href="#pricing" className="hover:text-slate-600">الأسعار</a>
            <Link href="/dashboard" className="hover:text-slate-600">لوحة التحكم</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
