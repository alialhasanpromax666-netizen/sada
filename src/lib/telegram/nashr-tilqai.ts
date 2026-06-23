/**
 * ════════════════════════════════════════════════════════════
 *  النشر الذاتي لقناة تيليغرام (Nashr Tilqai)
 * ════════════════════════════════════════════════════════════
 *
 * يربط الوكيل المختار بقناة تيليغرام فيولّد المحتوى ويُنشره «بنفسه»:
 *   - وَضع «فوري»  : يولّد منشوراً واحداً وينشره في القناة فوراً.
 *   - وَضع «جدولة» : يولّد عدّة منشورات ويوزّعها على نوافذ الذروة
 *                    (حالة MAJDWAL) ليتولّى المُجدْوِل نشرها عند موعدها.
 *
 * الموضوع اختياري؛ إن غاب اختار الوكيل أفكاراً من مجاله ومعرفته المرجعية.
 */

import { db } from "@/lib/db";
import { tawlidMuhtawa } from "@/lib/aql/aql";
import { jalbMiftahAql } from "@/lib/aql/miftah";
import { naffidhNashr } from "@/lib/nashir/tanfidh";
import { iqtirahAwqat } from "@/lib/mujadwil/mujadwil";
import { ansha2Ishaar } from "@/lib/isharat";
import type { RamzManassa, ShakhsiyyaWakeel, MuzawwidAql } from "@/lib/types";

export interface NatijatNashrTilqai {
  najah: boolean;
  adad?: number; // كم منشوراً وُلّد
  manshura?: number; // كم نُشر فوراً
  majdwala?: number; // كم جُدول
  rawabit?: string[]; // روابط المنشورات الناجحة
  khata?: string;
}

/**
 * يولّد محتوى الوكيل المرتبط بالقناة وينشره فوراً أو يجدوله.
 */
export async function nashrTilqaiTelegram(
  mustakhdimId: string,
  opts: { wad3: "fawri" | "jadwala"; mawdu?: string; adad?: number },
): Promise<NatijatNashrTilqai> {
  // 1) الوكيل المرتبط بالقناة.
  const mustakhdim = await db.mustakhdim.findUnique({
    where: { id: mustakhdimId },
    select: { wakeelTelegramId: true },
  });
  if (!mustakhdim?.wakeelTelegramId) {
    return { najah: false, khata: "لم تُربط أي وكيل بالقناة بعد." };
  }

  const wakeel = await db.wakeel.findFirst({
    where: { id: mustakhdim.wakeelTelegramId, mustakhdimId },
  });
  if (!wakeel) {
    return { najah: false, khata: "الوكيل المرتبط غير موجود — أعِد ربط وكيل." };
  }

  const manassat = JSON.parse(wakeel.manassat) as RamzManassa[];
  if (!manassat.includes("TELEGRAM")) {
    return {
      najah: false,
      khata: "الوكيل المرتبط لا يستهدف تيليغرام. أضِف تيليغرام إلى منصّاته.",
    };
  }

  // 2) توليد المحتوى عبر مزوّد الوكيل ونموذجه ومعرفته.
  const muzawwid = (wakeel.muzawwid as MuzawwidAql) ?? "ANTHROPIC";
  const miftahAql = await jalbMiftahAql(mustakhdimId, muzawwid);
  const adad = opts.wad3 === "fawri" ? 1 : Math.min(Math.max(opts.adad ?? 3, 1), 6);

  let manshurat: string[];
  try {
    manshurat = await tawlidMuhtawa({
      wakeel: {
        ism: wakeel.ism,
        wasf: wakeel.wasf,
        takhassus: wakeel.takhassus,
        shakhsiyya: JSON.parse(wakeel.shakhsiyya) as ShakhsiyyaWakeel,
        maarifa: wakeel.maarifa,
      },
      manassa: "TELEGRAM",
      mawdu: opts.mawdu,
      adad,
      muzawwid,
      namudhaj: wakeel.namudhaj,
      miftah: miftahAql,
    });
  } catch (e) {
    return { najah: false, khata: (e as Error).message };
  }

  manshurat = manshurat.filter((t) => t.trim());
  if (manshurat.length === 0) {
    return { najah: false, khata: "لم يُولّد العقل أي محتوى." };
  }

  // 3أ) فوري: أنشئ منشوراً وانشره الآن.
  if (opts.wad3 === "fawri") {
    const manshur = await db.manshur.create({
      data: { wakeelId: wakeel.id, manassa: "TELEGRAM", matn: manshurat[0], hala: "MUSAWWADA" },
    });
    const natija = await naffidhNashr(manshur.id, mustakhdimId);
    if (!natija.najah) {
      return { najah: false, adad: 1, khata: natija.khata };
    }
    return { najah: true, adad: 1, manshura: 1 };
  }

  // 3ب) جدولة: وزّع المنشورات على نوافذ الذروة القادمة.
  const mawaid = iqtirahAwqat("TELEGRAM", manshurat.length);
  let majdwala = 0;
  for (let i = 0; i < manshurat.length; i++) {
    await db.manshur.create({
      data: {
        wakeelId: wakeel.id,
        manassa: "TELEGRAM",
        matn: manshurat[i],
        hala: "MAJDWAL",
        mawiidNashr: mawaid[i] ?? mawaid[mawaid.length - 1] ?? new Date(),
      },
    });
    majdwala++;
  }

  // فعّل النشر التلقائي للوكيل ليواصل المُجدْوِل نشره ذاتياً.
  await db.wakeel.update({
    where: { id: wakeel.id },
    data: { awtomatiki: true },
  });

  await ansha2Ishaar({
    mustakhdimId,
    naw3: "NAJAH",
    unwan: "جُدول نشر ذاتي للقناة",
    matn: `جدول الوكيل "${wakeel.ism}" ${majdwala} منشوراً لقناة تيليغرام في أوقات الذروة.`,
  });

  return { najah: true, adad: manshurat.length, majdwala };
}
