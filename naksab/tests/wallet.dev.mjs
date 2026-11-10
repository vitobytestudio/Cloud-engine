/* بوابة محرك الدفع الحتمي: آلة الحالات + المراجع + المطابق الصارم (بلا شبكة) */
import { execSync } from "node:child_process";
import { unlinkSync } from "node:fs";
const hasLocal = (() => { try { execSync("test -x ./node_modules/.bin/esbuild", { stdio: "pipe" }); return true; } catch { return false; } })();
execSync(`${hasLocal ? "./node_modules/.bin/esbuild" : "npx --no-install esbuild"} src/payments.ts src/baridi.ts --bundle --format=esm --outdir=tests/.pw --log-level=silent`, { stdio: "pipe" });
const P = await import("./.pw/payments.js");
const B = await import("./.pw/baridi.js");
let fails = 0;
const t = (n, c) => { console.log((c ? "✓" : "✗") + " " + n); if (!c) fails++; };

/* آلة الحالات */
t("pending→confirmed قانوني", P.canTransit("pending", "confirmed"));
t("confirmed→refunded قانوني", P.canTransit("confirmed", "refunded"));
t("rejected→أي شيء ممنوع", !P.canTransit("rejected", "confirmed") && !P.canTransit("rejected", "pending"));
t("expired نهائي", !P.canTransit("expired", "confirmed"));
/* المراجع */
const ref = P.genReference("abc123def456");
t("المرجع بصيغة NK- ويطابق القاعدة", ref.startsWith("NK-") && P.REF_RE.test(ref));
t("مرجع عشوائي مرفوض", !P.REF_RE.test("XK-123"));
t("تطابق المبلغ التام فقط", P.amountExact(1250, 1250) && !P.amountExact(1250, 1250.5) && !P.amountExact(0, 0));
/* المطابق الصارم */
const now = Date.now();
const order = { id: "o1", reference: "NK-ABC123", amount_dzd: 2450, created_at: now - 60_000 };
const tr = (over = {}) => ({ id: "tr1", amount: 2450, label: "VIR RECU NK-ABC123 CLIENT", ts: now, ...over });
t("مطابقة كاملة ✓", B.matchTransfer(tr(), order).ok);
t("مبلغ مخالف يرفض", B.matchTransfer(tr({ amount: 2400 }), order).why.startsWith("amount"));
t("نافذة منتهية ترفض (11 دقيقة)", B.matchTransfer(tr({ ts: order.created_at + 11 * 60_000 }), order).why.startsWith("window"));
t("قبل إنشاء الطلب يرفض", B.matchTransfer(tr({ ts: order.created_at - 1000 }), order).why.startsWith("window"));
t("بلا مرجع في الوسم يرفض", B.matchTransfer(tr({ label: "VIR RECU sans ref" }), order).why === "reference_missing");
t("المرجع بأي تنسيق لصق يُعثر عليه", B.matchTransfer(tr({ label: "nk-abc-123" }), order).ok);
t("المرجع داخل وسط فوضوي يُعثر عليه", B.matchTransfer(tr({ label: "تحويل  من  X  — nk_abc123  شكرا" }), order).ok);
/* الاختيار */
const orders = [order, { id: "o2", reference: "NK-XYZ789", amount_dzd: 9900, created_at: now - 30_000 }];
t("pickMatch يعطي المطابق أولاً", B.pickMatch(tr(), orders)?.id === "o1");
t("pickMatch بلا مطابق يعطي null", B.pickMatch({ id: "t", amount: 111, label: "xx", ts: now }, orders) === null);
/* أعلام المخاطرة */
t("أعلام المخاطرة: سرعة+أول كبير+حساب فطري", JSON.stringify(P.riskFlags({ userPayments24h: 6, userConfirmedTotal: 0, amount: 12000, accountAgeH: 0 })) === JSON.stringify(["velocity_high", "first_large", "account_fresh"]));
try { unlinkSync("tests/.pw/payments.js"); unlinkSync("tests/.pw/baridi.js"); } catch {}
if (fails) { console.error(`فشل ${fails}`); process.exit(1); }
console.log("WALLET: محرك الدفع الحتمي مطموع");
