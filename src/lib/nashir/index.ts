/**
 * مصنع النّاشرين (Publisher Factory).
 * يربط رمز كل منصّة بمحوّلها المناسب، فيستهلك بقيّة النظام
 * واجهة "Nashir" المجرّدة دون معرفة التفاصيل.
 */

import type { Nashir } from "./nashir-base";
import { NashirX } from "./nashir-x";
import { NashirLinkedIn, NashirMeta, NashirTikTok } from "./nashir-others";
import { NashirTelegram } from "./nashir-telegram";
import { MANASSAT, type RamzManassa } from "@/lib/types";

// خريطة المنصّة → محوّلها. إنستغرام وفيسبوك يتشاركان محوّل ميتا.
const SIJILL: Partial<Record<RamzManassa, () => Nashir>> = {
  X: () => new NashirX(),
  LINKEDIN: () => new NashirLinkedIn(),
  INSTAGRAM: () => new NashirMeta(),
  FACEBOOK: () => new NashirMeta(),
  TIKTOK: () => new NashirTikTok(),
  TELEGRAM: () => new NashirTelegram(),
};

/**
 * جَلْب نَاشِر: يُرجِع محوّل النشر المناسب لمنصّة ما.
 */
export function jalbNashir(manassa: RamzManassa): Nashir {
  const sani3 = SIJILL[manassa];
  if (!sani3) {
    throw new Error(`[صَدَى/ناشر] لا يوجد محوّل للمنصّة: ${manassa}`);
  }
  return sani3();
}

/**
 * يربط رمز المنصّة بخدمة المفتاح المطلوبة للنشر عليها.
 * (إنستغرام/فيسبوك → مفتاح META موحّد)
 */
export function khidmatManassa(manassa: RamzManassa): string {
  if (manassa === "INSTAGRAM" || manassa === "FACEBOOK") return "META";
  return manassa;
}

export { MANASSAT };
export type { Nashir };
