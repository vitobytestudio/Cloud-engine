// إنشاء جلسة تيليجرام — يُشغَّل مرة واحدة على حاسوبك:
//   npm i telegram input && node radar/telegram-session.mjs
// أدخل رقم هاتفك وكود التحقق، ثم انسخ SESSION إلى سر GitHub باسم TELEGRAM_SESSION
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";

const API_ID = Number(process.env.TELEGRAM_API_ID ?? (await input.number("api_id من my.telegram.org: ")));
const API_HASH = process.env.TELEGRAM_API_HASH ?? (await input.text("api_hash: "));
const client = new TelegramClient(new StringSession(""), API_ID, API_HASH, { connectionRetries: 3 });
await client.start({
  phoneNumber: async () => input.text("رقم الهاتف (مع رمز البلد): "),
  password: async () => input.text("كلمة سر التحقق الثنائي إن وُجدت: "),
  phoneCode: async () => input.text("كود التحقق: "),
  onError: (e) => console.error(e),
});
console.log("\n=== انسخ هذه الجلسة إلى سر TELEGRAM_SESSION (لا تشاركها مع أحد) ===");
console.log(client.session.save());
await client.disconnect();
