import Link from "next/link";
import {
  ArrowDown,
  ArrowUpLeft,
  Check,
  Crosshair,
  Inbox,
  MessageSquareDot,
  ShieldCheck,
  FileDown,
  Users,
  Scale,
} from "lucide-react";
import { Reveal, Counter, SectionHead } from "@/components/landing/motion";
import HeroFeed from "@/components/landing/hero-feed";
import ChannelMarquee from "@/components/landing/marquee";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-600/40">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M2.4 11.1 20.8 3.2c.8-.34 1.6.44 1.3 1.26l-6 16.9c-.3.86-1.5.9-1.9.06l-2.6-5.8a1.4 1.4 0 0 0-.6-.64l-5.9-3.2c-.8-.44-.7-1.62.2-1.7Zm7.9 5.4 1.8 3.9 2.6-7.2-4.4 3.3Zm5-4.5 2.4-6.8-10.5 4.6 4.5 2.4c.3.17.55.4.74.7l.36.5 2.5-1.4Z" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[17px] font-black text-white">مِرسال</div>
        <div className="text-[9.5px] font-bold tracking-wide text-slate-500">
          تقنية الفرص الجزائرية
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    n: "01",
    icon: Crosshair,
    title: "رصد الفرص لحظة نشرها",
    desc: "محرك استماع يعمل على مدار الساعة يرصد طلبات العملاء عبر القنوات الرسمية — ويوصلها إليك خلال ثوانٍ من نشرها، مع رابط المنشور الأصلي وسياقه الكامل.",
    span: "md:col-span-2",
  },
  {
    n: "02",
    icon: Inbox,
    title: "مركز محادثات موحّد",
    desc: "كل رسائل صفحاتك ومنصاتك في صندوق واحد منظّم، بحالة قراءة وتذكيرات ذكية — لا رسالة تضيع بعد اليوم.",
    span: "",
  },
  {
    n: "03",
    icon: MessageSquareDot,
    title: "ردود آلية بالعربية",
    desc: "قوالب رد ذكية ترد على الاستفسارات خلال ثوانٍ وتطلب بيانات التواصل بأدب مهني — بينما أنت منشغل بعملك.",
    span: "",
  },
  {
    n: "04",
    icon: Users,
    title: "ملفات عملاء احترافية",
    desc: "سجل كامل لكل عميل: مصدره، محادثاته، حالة الملف، وملاحظاتك — قراراتك مبنية على بيانات لا على الذاكرة.",
    span: "",
  },
  {
    n: "05",
    icon: FileDown,
    title: "صفحات استقبال بأعلى تحويل",
    desc: "روابط استقبال أنيقة تجمع بيانات الزبون بموافقته الصريحة وتصل ملفك فوراً — جاهزة للمشاركة في السيرة والحملات.",
    span: "",
  },
  {
    n: "06",
    icon: Scale,
    title: "امتثال كامل وحماية حساباتك",
    desc: "بناء حصري على الواجهات الرسمية، وحذف تلقائي للبيانات الأقدم من 72 ساعة — توافق تام مع قانون 18-07 وGDPR. حساباتك لا تُعرَّض لأي مخاطرة.",
    span: "md:col-span-2",
  },
];

const STEPS = [
  {
    n: "01",
    title: "اربط مصادرك رسمياً",
    desc: "صفحاتك على ميتا، حساب إكس، قنوات تيليغرام العامة، وخلاصات المواقع — ربط رسمي بمصادقة آمنة خلال دقائق.",
  },
  {
    n: "02",
    title: "حدّد تخصصك وكلماته",
    desc: "«مصمم شعارات»، «مطور ووردبريس»، «مصور أعراس»… المحرك يضبط الرصد على طلبات تخصصك في ولاياتك.",
  },
  {
    n: "03",
    title: "استقبل الفرص وأغلق الصفقات",
    desc: "كل فرصة تصل بسياقها ورابطها وتقييم ملاءمتها — تفتح المحادثة من مكانها وتحوّلها إلى عقد.",
  },
];

const FAQS = [
  {
    q: "هل الرصد قانوني وآمن على حساباتي؟",
    a: "نعم حصراً. نعتمد الواجهات الرسمية للمنصات (Meta Graph API، X API، Telegram Bot API، خلاصات RSS العامة) ونجمع المحتوى العام الظاهر للجميع فقط. لا سحب لأرقام، لا بيانات خاصة، ولا أدوات تتجاوز حماية المنصات — لأن تلك الطرق تُسقط الحسابات وتُعدّ مخالفة قانونية.",
  },
  {
    q: "ماذا يعني «الجديد فقط»؟",
    a: "كل فرصة تحمل ختم زمنياً لنشرها الأصلي، وتُعرض مرتبةً زمنياً، وتُحذف تلقائياً بعد 72 ساعة من نشرها. لن ترى فرصة أسبوع مضى — السوق لا ينتظر، ونحن كذلك.",
  },
  {
    q: "أنا فريلانسر مبتدئ — هل المنصة لي؟",
    a: "صُممت من أجلك. خطة الانطلاقة مجانية للأبد، وتكتفي بإعداد واحد: تخصصك + كلماتك + ولايتك. المنصة تتكفل بالرصد والترتيب والتذكير.",
  },
  {
    q: "كيف أدفع؟ وهل أسعّرت بالدينار؟",
    a: "نعم، بالدينار الجزائري وبطرق دفع محلية (CIB / الذهبية) عند الإطلاق التجاري. فترة التجربة الحالية مجانية بالكامل وبطاقة غير مطلوبة.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#06060b] text-white antialiased">
      {/* ——— الشريط العلوي ——— */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#06060b]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-8 text-[13px] font-bold text-slate-400 md:flex">
            <a href="#product" className="transition hover:text-white">المنتج</a>
            <a href="#how" className="transition hover:text-white">كيف يعمل</a>
            <a href="#trust" className="transition hover:text-white">الأمان والامتثال</a>
            <a href="#pricing" className="transition hover:text-white">الأسعار</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden text-[13px] font-bold text-slate-400 transition hover:text-white sm:block">
              الدخول
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-4 py-2 text-[13px] font-black text-[#06060b] transition hover:bg-violet-100"
            >
              جرّب النموذج الحي
            </Link>
          </div>
        </div>
      </header>

      {/* ——— البطل ——— */}
      <section className="relative overflow-hidden pb-24 pt-36 md:pt-44">
        {/* خلفية الشفق */}
        <div className="pointer-events-none absolute inset-0">
          <div className="aurora-a absolute -top-40 start-[15%] h-[420px] w-[620px] rounded-full bg-violet-600/[0.16] blur-[120px]" />
          <div className="aurora-b absolute -top-20 end-[8%] h-[360px] w-[480px] rounded-full bg-fuchsia-600/[0.10] blur-[110px]" />
          <div className="absolute inset-0 grid-overlay" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pe-4 ps-2 text-[12px] font-extrabold text-slate-300">
                  <span className="rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-500 px-2.5 py-0.5 text-[10px] font-black text-white">
                    2026
                  </span>
                  منصة رصد العملاء الأولى للفريلانسر الجزائري
                </div>
              </Reveal>

              <Reveal delay={110}>
                <h1 className="mt-7 text-[40px] font-black leading-[1.22] sm:text-[54px] sm:leading-[1.18] md:text-[62px] md:leading-[1.15]">
                  الفرص تصل إليك.
                  <br />
                  <span className="bg-gradient-to-l from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                    لا تلاحظها بعد اليوم.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={220}>
                <p className="mt-6 max-w-xl text-[15.5px] leading-9 text-slate-400">
                  «مِرسال» يرصد طلبات العملاء عبر وسائل التواصل والمجموعات والقنوات —
                  <span className="text-slate-200"> لحظة نشرها </span>
                  — ويحوّلها إلى محادثات وعقود. عبر القنوات الرسمية حصراً، وبأعلى معايير
                  الأمان المؤسسي.
                </p>
              </Reveal>

              <Reveal delay={330}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-[14px] font-black text-[#06060b] shadow-[0_8px_40px_-8px] shadow-violet-500/40 transition hover:bg-violet-50"
                  >
                    ابدأ التجربة المجانية
                    <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" />
                  </Link>
                  <a
                    href="#how"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-4 text-[14px] font-black text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    كيف يعمل
                    <ArrowDown className="h-4 w-4 opacity-60" />
                  </a>
                </div>
              </Reveal>

              <Reveal delay={440}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    واجهات رسمية 100٪
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    بلا مخاطرة على حساباتك
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    فترة التجربة مجانية بالكامل
                  </span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={260} y={40}>
              <div className="float-y">
                <HeroFeed />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ——— شريط القنوات الرسمية ——— */}
      <Reveal>
        <ChannelMarquee />
      </Reveal>

      {/* ——— الأرقام ——— */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.04] md:grid-cols-4">
            {[
              { v: 60, suffix: "s", label: "متوسط زمن وصول الفرصة", note: "من النشر إلى لوحتك" },
              { v: 120, suffix: "+", label: "فرصة أسبوعياً للتخصص الواحد", note: "متوسط القنوات النشطة" },
              { v: 72, suffix: "h", label: "نافذة الجديد فقط", note: "ثم تُحذف تلقائياً" },
              { v: 100, suffix: "%", label: "قنوات رسمية معتمدة", note: "صفر مخاطر على حساباتك" },
            ].map((s, i) => (
              <div key={s.label} className="bg-[#08080f] p-7 md:p-9">
                <Reveal delay={i * 90}>
                  <div className="text-[34px] font-black text-white md:text-[40px]">
                    <Counter to={s.v} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 text-[12.5px] font-extrabold text-slate-300">{s.label}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500">{s.note}</div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— المنتج: شبكة المزايا ——— */}
      <section id="product" className="relative py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="aurora-a absolute top-1/3 start-[30%] h-[380px] w-[560px] rounded-full bg-violet-600/[0.07] blur-[130px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5">
          <SectionHead
            overline="المنتج"
            title={
              <>
                منظومة متكاملة، لا مجرد أداة بحث
                <span className="block text-slate-500">من لحظة النشر إلى توقيع العقد</span>
              </>
            }
            sub="ستة أنظمة تعمل كوحدة واحدة — بُنيت لسير عمل الفريلانسر الحقيقي في الجزائر: الرصد، التواصل، الملفات، والامتثال."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.n} delay={(i % 3) * 110} className={f.span}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] p-7 transition duration-500 hover:border-violet-400/25 hover:bg-white/[0.05]">
                  <div className="pointer-events-none absolute -top-24 start-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-violet-500/0 blur-3xl transition duration-700 group-hover:bg-violet-500/10" />
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-violet-300 transition duration-500 group-hover:border-violet-400/30 group-hover:bg-violet-500/15">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[12px] font-black tabular-nums text-slate-600" dir="ltr">
                      {f.n}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-black text-white">{f.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-7 text-slate-400">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— كيف يعمل ——— */}
      <section id="how" className="relative border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead
            overline="آلية العمل"
            title="ثلاث خطوات… ثم يعمل النظام نيابة عنك"
            sub="إعداد لمرة واحدة يستغرق أقل من عشر دقائق، ثم يتحول مِرسال إلى قسم تجاري كامل يعمل 24/7."
          />
          <div className="relative grid gap-5 md:grid-cols-3">
            <div className="absolute inset-x-16 top-[52px] hidden h-px bg-gradient-to-l from-violet-500/0 via-violet-500/40 to-violet-500/0 md:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 140}>
                <div className="relative rounded-3xl border border-white/[0.07] bg-[#0a0a14] p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[15px] font-black text-white shadow-lg shadow-violet-600/30">
                    {s.n}
                  </div>
                  <h3 className="mt-6 text-[17px] font-black text-white">{s.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-7 text-slate-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— الأمان والامتثال ——— */}
      <section id="trust" className="relative py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHead
                center={false}
                overline="الأمان والامتثال"
                title={
                  <>
                    المسار الرسمي ليس خياراً أخلاقياً فقط —
                    <span className="text-slate-500"> إنه ميزة تنافسية</span>
                  </>
                }
                sub="الأدوات التي «تسحب» البيانات تُفصح عن حسابات مستخدميها وتُقاضى قانونياً. نحن اخترنا الطريق الذي تبني عليه اسماً يدوم."
              />
              <div className="space-y-4">
                {[
                  ["قنوات رسمية حصراً", "Meta Graph API، WhatsApp Business Platform، X API، Telegram Bot API، وخلاصات RSS معلنة."],
                  ["محتوى عام فقط", "ما يظهر للجميع: نص المنشور، اسم الناشر العلني، تاريخه، وتفاعلاته — لا شيء آخر."],
                  ["خصوصية بالتصميم", "حذف تلقائي بعد 72 ساعة، موافقة صريحة قبل حفظ أي رقم، وتوافق كامل مع قانون 18-07 الجزائري وGDPR."],
                ].map(([t, d], i) => (
                  <Reveal key={t} delay={i * 110}>
                    <div className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      </span>
                      <div>
                        <div className="text-[14.5px] font-black text-white">{t}</div>
                        <div className="mt-1 text-[12.5px] leading-7 text-slate-400">{d}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={200} y={36}>
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-8">
                <div className="aurora-a pointer-events-none absolute -top-24 end-0 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl" />
                <div className="text-[13px] font-black text-slate-400">مقارنة المؤسسات</div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] p-5">
                    <div className="text-[13.5px] font-black text-rose-300">أدوات السحب غير الرسمية</div>
                    <ul className="mt-3 space-y-2 text-[12px] font-semibold leading-6 text-slate-400">
                      {["تعليق أو حظر دائم للحسابات", "مسؤولية قانونية مباشرة", "أرقام بلا موافقة لا تُجيب", "سمعة تُدمّر علامتك"].map((x) => (
                        <li key={x} className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-rose-400/70" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                    <div className="text-[13.5px] font-black text-emerald-300">مِرسال — المعيار المؤسسي</div>
                    <ul className="mt-3 space-y-2 text-[12px] font-semibold leading-6 text-slate-300">
                      {["حسابات محمية بالكامل", "توثيق قانوني لكل بيانات", "عملاء أعطوك تواصلهم طوعاً", "علامة تُبنى لتدوم"].map((x) => (
                        <li key={x} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ——— الأسعار ——— */}
      <section id="pricing" className="relative border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead
            overline="الأسعار"
            title="بدينار جزائري، وبمعايير عالمية"
            sub="فترة التجربة الحالية مجانية بالكامل. عند الإطلاق التجاري: دفع محلي بـ CIB والذهبية، بلا التزام طويل."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "انطلاقة",
                price: "0",
                unit: "دج / للأبد",
                desc: "لتبدأ وتتحقق من النتائج",
                feats: ["رصد تخصص واحد", "50 فرصة شهرياً", "مركز المحادثات", "صفحة استقبال واحدة"],
                cta: "ابدأ الآن",
                hot: false,
              },
              {
                name: "برو",
                price: "1.900",
                unit: "دج / شهرياً",
                desc: "للفريلانسر الجاد",
                feats: ["رصد غير محدود", "فرص غير محدودة", "ردود آلية بالعربية", "ملفات عملاء كاملة", "أولوية الوصول للفرص الجديدة"],
                cta: "جرّب 14 يوماً مجاناً",
                hot: true,
              },
              {
                name: "أعمال",
                price: "4.900",
                unit: "دج / شهرياً",
                desc: "للوكالات وفرق العمل",
                feats: ["كل مزايا برو", "مساحات عمل متعددة", "أعضاء فريق وصلاحيات", "تقارير أداء شهرية", "مدير حساب مخصص"],
                cta: "تواصل معنا",
                hot: false,
              },
            ].map((p, i) => (
              <Reveal key={p.name} delay={i * 120}>
                <div
                  className={`relative h-full rounded-3xl border p-8 transition duration-500 ${
                    p.hot
                      ? "border-violet-400/30 bg-gradient-to-b from-violet-500/[0.10] to-white/[0.02] shadow-[0_20px_70px_-20px] shadow-violet-600/30"
                      : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14]"
                  }`}
                >
                  {p.hot && (
                    <span className="absolute -top-3.5 start-1/2 -translate-x-1/2 rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-1 text-[11px] font-black text-white shadow-lg shadow-violet-600/40">
                      الخيار الأنسب للفريلانسر
                    </span>
                  )}
                  <div className="text-[14px] font-black text-slate-300">{p.name}</div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-[42px] font-black leading-none text-white" dir="ltr">
                      {p.price}
                    </span>
                    <span className="pb-1 text-[12px] font-bold text-slate-500">{p.unit}</span>
                  </div>
                  <div className="mt-2 text-[12px] font-semibold text-slate-500">{p.desc}</div>
                  <div className="hairline my-6" />
                  <ul className="space-y-3">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-300">
                        <Check className="h-4 w-4 shrink-0 text-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={`mt-8 block rounded-2xl py-3.5 text-center text-[13.5px] font-black transition ${
                      p.hot
                        ? "bg-white text-[#06060b] hover:bg-violet-100"
                        : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— الأسئلة الشائعة ——— */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHead overline="أسئلة متكررة" title="كل ما تريد معرفته" />
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 80}>
                <details className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] transition open:border-violet-400/25 open:bg-white/[0.05]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[14px] font-black text-slate-200 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition group-open:rotate-45 group-open:border-violet-400/30 group-open:text-violet-300">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[13px] leading-8 text-slate-400">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— النداء الأخير ——— */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-violet-400/20 bg-gradient-to-l from-violet-600/[0.16] via-violet-600/[0.07] to-fuchsia-600/[0.12] px-8 py-16 text-center md:py-20">
              <div className="aurora-a pointer-events-none absolute -top-32 start-1/3 h-72 w-[500px] rounded-full bg-violet-500/20 blur-[100px]" />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-3xl font-black leading-[1.4] text-white md:text-[40px] md:leading-[1.35]">
                  كل فرصة تفوتك الآن —
                  <span className="block text-violet-300">يعتني بها منافسك.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[14px] leading-8 text-slate-400">
                  فعّل مِرسال اليوم، ودع أول فرصة تصل إليك خلال دقائق من الآن.
                </p>
                <Link
                  href="/dashboard"
                  className="group mt-9 inline-flex items-center gap-2 rounded-2xl bg-white px-9 py-4 text-[14.5px] font-black text-[#06060b] shadow-[0_10px_50px_-10px] shadow-violet-500/50 transition hover:bg-violet-50"
                >
                  افتح لوحتك الآن
                  <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ——— التذييل ——— */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Logo />
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[12.5px] font-bold text-slate-500">
              <a href="#product" className="transition hover:text-slate-300">المنتج</a>
              <a href="#pricing" className="transition hover:text-slate-300">الأسعار</a>
              <a href="#trust" className="transition hover:text-slate-300">الامتثال</a>
              <Link href="/dashboard" className="transition hover:text-slate-300">لوحة التحكم</Link>
            </div>
            <div className="text-[12px] font-semibold text-slate-600">
              © 2026 مِرسال — الجزائر
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
