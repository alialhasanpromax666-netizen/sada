/**
 * ════════════════════════════════════════════════════════════
 *  تَنْفِيذ النَّشْر (Tanfidh) — منطق النشر المشترك
 * ════════════════════════════════════════════════════════════
 *
 * يجمع تدفّق نشر منشور واحد في دالة واحدة يستهلكها كلٌّ من:
 *   - النشر اليدوي  (/api/manshurat/:id/nashr)
 *   - المُجدْوِل التلقائي (/api/mujadwil/tanfidh) للمنشورات المستحقّة
 *
 * التدفّق: تحميل المنشور ← جلب مفتاح المنصّة وفكّ تشفيره ← وضع
 *         «قيد النشر» ← استدعاء المحوّل ← تحديث الحالة ← إشعار فوري.
 */

import { db } from "@/lib/db";
import { kashf } from "@/lib/tashfeer";
import { jalbNashir, khidmatManassa } from "@/lib/nashir";
import { ansha2Ishaar } from "@/lib/isharat";
import type { RamzManassa } from "@/lib/types";

export interface NatijatTanfidh {
  najah: boolean;
  /** معرّف المنشور على المنصّة بعد النشر */
  maerifNashr?: string;
  khata?: string;
}

/**
 * نَشْر منشور واحد بمعرّفه نيابةً عن مستخدم.
 * يتحقّق من الملكيّة، ويتولّى انتقالات الحالة وتهيئة التحليلات والإشعار.
 */
export async function naffidhNashr(
  manshurId: string,
  mustakhdimId: string,
): Promise<NatijatTanfidh> {
  const manshur = await db.manshur.findFirst({
    where: { id: manshurId, wakeel: { mustakhdimId } },
    include: { wakeel: { select: { ism: true } } },
  });
  if (!manshur) return { najah: false, khata: "المنشور غير موجود." };

  const manassa = manshur.manassa as RamzManassa;
  const khidma = khidmatManassa(manassa);

  // جلب مفتاح المنصّة المفعّل.
  const miftah = await db.miftah.findFirst({
    where: { mustakhdimId, manassa: khidma, fa3aal: true },
  });
  if (!miftah) {
    const khata = `لا يوجد مفتاح مفعّل لمنصّة ${khidma}. أضِفه في خزنة المفاتيح.`;
    await db.manshur.update({
      where: { id: manshur.id },
      data: { hala: "FASHIL", khata },
    });
    return { najah: false, khata };
  }

  // وضع علامة «قيد النشر».
  await db.manshur.update({
    where: { id: manshur.id },
    data: { hala: "QAYD_NASHR" },
  });

  let sirr: string;
  try {
    sirr = kashf(miftah.qimaMushaffara);
  } catch {
    await db.manshur.update({
      where: { id: manshur.id },
      data: { hala: "FASHIL", khata: "تعذّر فكّ تشفير المفتاح." },
    });
    return { najah: false, khata: "تعذّر فكّ تشفير المفتاح." };
  }

  // تنفيذ النشر عبر المحوّل المناسب.
  const natija = await jalbNashir(manassa).nashr(manshur.matn, sirr);

  // تحديث مؤشّرات استخدام المفتاح (أساس التدوير والمراقبة).
  await db.miftah.update({
    where: { id: miftah.id },
    data: { akhirIstikhdam: new Date(), marratIstikhdam: { increment: 1 } },
  });

  if (natija.najah) {
    await db.manshur.update({
      where: { id: manshur.id },
      data: {
        hala: "MANSHUR",
        nushiraFi: new Date(),
        maerifNashr: natija.maerifNashr,
        khata: null,
      },
    });
    // تهيئة سجلّ تحليلات فارغ يُملأ لاحقاً.
    await db.tahlil.upsert({
      where: { manshurId: manshur.id },
      update: {},
      create: { manshurId: manshur.id },
    });
    await ansha2Ishaar({
      mustakhdimId,
      naw3: "NAJAH",
      unwan: "تمّ النشر بنجاح",
      matn: `نشر "${manshur.wakeel.ism}" منشوراً على ${manassa}.`,
    });
    return { najah: true, maerifNashr: natija.maerifNashr };
  }

  // فشل النشر.
  await db.manshur.update({
    where: { id: manshur.id },
    data: { hala: "FASHIL", khata: natija.khata },
  });
  await ansha2Ishaar({
    mustakhdimId,
    naw3: "KHATA",
    unwan: "فشل النشر",
    matn: `تعذّر النشر على ${manassa}: ${natija.khata}`,
  });
  return { najah: false, khata: natija.khata };
}
