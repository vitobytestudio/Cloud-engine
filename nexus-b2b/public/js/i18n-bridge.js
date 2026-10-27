// جسر صغير: t + toast من مصدر واحد
export { t } from "../i18n.js";
import { toast as tt } from "../api.js";
export const toast = (m) => tt(m);
