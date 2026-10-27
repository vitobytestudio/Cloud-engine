// جسر صغير: t + toast من مصدر واحد (مسارات مصححة — نفس المجلد)
export { t } from "./i18n.js";
import { toast as tt } from "./api.js";
export const toast = (m) => tt(m);
