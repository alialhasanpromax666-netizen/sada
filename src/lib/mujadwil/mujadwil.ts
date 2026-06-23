/**
 * ════════════════════════════════════════════════════════════
 *  المُجَدْوِل (Mujadwil) — محرّك الجدولة الذكية
 * ════════════════════════════════════════════════════════════
 *
 * يقترح أفضل أوقات النشر بناءً على نوافذ التفاعل الذروية المعروفة
 * لكل منصّة (heuristics)، ويحدّد المنشورات المستحقّة للنشر الآن.
 *
 * ملاحظة: القيم أدناه إرشادية مبنية على متوسّطات شائعة. في الإنتاج
 * يُفضّل اشتقاقها من بيانات التفاعل الفعلية لكل وكيل (طبقة تعلّم).
 */

import type { RamzManassa } from "@/lib/types";

/** ساعات الذروة (24h، توقيت محلي) لكل منصّة */
const NAWAFITH_DHURWA: Record<RamzManassa, number[]> = {
  X: [8, 12, 17, 21], // صباح، ظهر، نهاية الدوام، مساء
  LINKEDIN: [8, 10, 12, 17], // ساعات العمل
  INSTAGRAM: [11, 13, 19, 21], // منتصف النهار والمساء
  FACEBOOK: [9, 13, 15, 20],
  TIKTOK: [9, 12, 19, 22], // المساء يتفوّق
  TELEGRAM: [9, 13, 18, 21], // قنوات تيليغرام: نشاط نهاري ومسائي
};

/**
 * اقْتِراح أوْقات: يُرجِع أقرب N مواعيد ذروة قادمة لمنصّة ما.
 *
 * @param manassa المنصّة
 * @param adad عدد المواعيد المطلوبة
 * @param min نقطة البداية (افتراضي: الآن)
 */
export function iqtirahAwqat(
  manassa: RamzManassa,
  adad = 5,
  min: Date = new Date(),
): Date[] {
  const sa3at = NAWAFITH_DHURWA[manassa];
  const mawaid: Date[] = [];
  const cursor = new Date(min);

  // ابحث حتى 14 يوماً قادمة عن نوافذ ذروة كافية.
  for (let yawm = 0; yawm < 14 && mawaid.length < adad; yawm++) {
    for (const sa3a of sa3at) {
      const mawid = new Date(cursor);
      mawid.setDate(cursor.getDate() + yawm);
      mawid.setHours(sa3a, 0, 0, 0);
      if (mawid > min) {
        mawaid.push(mawid);
        if (mawaid.length >= adad) break;
      }
    }
  }
  return mawaid;
}

/**
 * أفْضَل مَوْعِد: أقرب نافذة ذروة قادمة (موعد واحد).
 */
export function afdalMawid(manassa: RamzManassa, min: Date = new Date()): Date {
  return iqtirahAwqat(manassa, 1, min)[0];
}

/**
 * تَوْزِيع ذَكِي: يوزّع مجموعة منشورات على نوافذ ذروة متتالية
 * لتجنّب الإغراق وتعظيم الوصول.
 *
 * @returns مصفوفة مواعيد بنفس طول عدد المنشورات.
 */
export function tawziDhaki(
  manassa: RamzManassa,
  adadManshurat: number,
  min: Date = new Date(),
): Date[] {
  return iqtirahAwqat(manassa, adadManshurat, min);
}

/**
 * تقييم جودة موعد مقترح (0–100) — يُستخدم لإظهار مؤشّر بصري في الواجهة.
 * كلّما اقترب الموعد من ساعة ذروة، ارتفعت الدرجة.
 */
export function jawdatMawid(manassa: RamzManassa, mawid: Date): number {
  const sa3at = NAWAFITH_DHURWA[manassa];
  const sa3a = mawid.getHours() + mawid.getMinutes() / 60;
  const aqrabFarq = Math.min(...sa3at.map((s) => Math.abs(s - sa3a)));
  // فرق 0 ساعة → 100، فرق 3 ساعات أو أكثر → 40.
  const daraja = Math.max(40, 100 - aqrabFarq * 20);
  return Math.round(daraja);
}
