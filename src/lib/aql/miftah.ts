/**
 * جَلْب مفتاح العقل — منطق مشترك لاسترجاع مفتاح مزوّد التوليد المفعّل
 * لمستخدم وفكّ تشفيره وتحديث مؤشّرات استخدامه.
 */
import { db } from "@/lib/db";
import { kashf } from "@/lib/tashfeer";
import { MUZAWWIDUN, type MuzawwidAql } from "@/lib/types";

/**
 * يُرجِع مفتاح المزوّد المفعّل (مفكوك التشفير) لمستخدم، أو undefined إن لم
 * يوجد. يحدّث عدّاد الاستخدام وآخر استخدام عند النجاح.
 */
export async function jalbMiftahAql(
  mustakhdimId: string,
  muzawwid: MuzawwidAql,
): Promise<string | undefined> {
  const khidma = MUZAWWIDUN[muzawwid]?.khidma ?? "BYNARA";

  const miftahDb = await db.miftah.findFirst({
    where: { mustakhdimId, manassa: khidma, fa3aal: true },
    orderBy: { createdAt: "desc" },
  });
  if (!miftahDb) return undefined;

  try {
    const sirr = kashf(miftahDb.qimaMushaffara);
    await db.miftah.update({
      where: { id: miftahDb.id },
      data: { akhirIstikhdam: new Date(), marratIstikhdam: { increment: 1 } },
    });
    return sirr;
  } catch {
    // فشل فكّ التشفير — يعامله المستدعي كغياب مفتاح.
    return undefined;
  }
}
