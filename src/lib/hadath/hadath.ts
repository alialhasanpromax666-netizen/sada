/**
 * ════════════════════════════════════════════════════════════
 *  الحَدَث (Hadath) — ناقل الأحداث للإشعارات الفورية
 * ════════════════════════════════════════════════════════════
 *
 * ناقل نشر/اشتراك (pub/sub) في الذاكرة يغذّي قناة الإشعارات
 * الفورية. نستخدم Server-Sent Events (SSE) كآلية دفع فورية —
 * أبسط من WebSocket وأنسب لتدفّق أحادي الاتجاه (خادم → عميل)،
 * ويعمل أصلاً داخل Route Handlers في Next.js.
 *
 * (للترقية إلى WebSocket ثنائي الاتجاه، استبدل هذه الطبقة بخادم ws
 *  مع الإبقاء على نفس واجهة bathIshaar.)
 */

import type { IshaarNaw3 } from "@/lib/types";

export interface IshaarBath {
  id: string;
  naw3: IshaarNaw3;
  unwan: string;
  matn: string;
  waqt: string; // ISO timestamp
}

type Mustami = (ishaar: IshaarBath) => void;

// مجموعة المستمعين النشطين (كل اتصال SSE مفتوح).
const mustamiun = new Set<Mustami>();

/**
 * تَسْجِيل مُسْتَمِع: يضيف مستمعاً جديداً ويُرجِع دالة إلغاء الاشتراك.
 */
export function sajjilMustami(mustami: Mustami): () => void {
  mustamiun.add(mustami);
  return () => mustamiun.delete(mustami);
}

/**
 * بَثّ إشْعار: يدفع إشعاراً إلى كل المستمعين النشطين فوراً.
 */
export function bathIshaar(ishaar: IshaarBath): void {
  for (const mustami of mustamiun) {
    try {
      mustami(ishaar);
    } catch {
      // مستمع معطوب — تجاهله بهدوء.
    }
  }
}

/** عدد المتّصلين حالياً (لمؤشّر الحالة). */
export function adadMutasilin(): number {
  return mustamiun.size;
}
