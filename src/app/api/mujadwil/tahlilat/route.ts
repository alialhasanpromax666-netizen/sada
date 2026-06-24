/**
 * واجهة تحديث التحليلات — تجلب بيانات الأداء الفعلية من المنصات.
 *
 * POST /api/mujadwil/tahlilat  (يتطلّب x-cron-secret)
 *
 * تمرّ على كل المنشورات المنشورة التي لها maerifNashr، تجلب إحصائيات
 * كل منصّة، ثم تحدّث سجلّ Tahlil المقابل.
 */
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { kashf } from "@/lib/tashfeer";
import { jalbNashir, khidmatManassa } from "@/lib/nashir";
import type { RamzManassa } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ khata: "غير مصرّح." }, { status: 401 });
  }

  // جلب كل المنشورات المنشورة التي لها معرّف على المنصّة
  const manshurat = await db.manshur.findMany({
    where: { hala: "MANSHUR", maerifNashr: { not: null } },
    include: {
      wakeel: { select: { mustakhdimId: true } },
      tahlil: true,
    },
    take: 50,
  });

  let updatedCount = 0;

  for (const manshur of manshurat) {
    const manassa = manshur.manassa as RamzManassa;
    const mustakhdimId = manshur.wakeel.mustakhdimId;
    const khidma = khidmatManassa(manassa);

    // جلب مفتاح المنصّة
    const miftah = await db.miftah.findFirst({
      where: { mustakhdimId, manassa: khidma, fa3aal: true },
    });
    if (!miftah) continue;

    let sirr: string;
    try {
      sirr = kashf(miftah.qimaMushaffara);
    } catch {
      continue;
    }

    try {
      const nashir = jalbNashir(manassa);
      const atdaa = await nashir.jibAtdaa(manshur.maerifNashr!, sirr);
      if (!atdaa) continue;

      const mu3addal =
        atdaa.mushahadat > 0
          ? ((atdaa.i3jabat + atdaa.musharakat + atdaa.ta3liqat) / atdaa.mushahadat) * 100
          : 0;

      await db.tahlil.upsert({
        where: { manshurId: manshur.id },
        update: {
          mushahadat: atdaa.mushahadat,
          i3jabat: atdaa.i3jabat,
          musharakat: atdaa.musharakat,
          ta3liqat: atdaa.ta3liqat,
          mu3addalTafa3ul: Math.round(mu3addal * 100) / 100,
          akhirTahdith: new Date(),
        },
        create: {
          manshurId: manshur.id,
          mushahadat: atdaa.mushahadat,
          i3jabat: atdaa.i3jabat,
          musharakat: atdaa.musharakat,
          ta3liqat: atdaa.ta3liqat,
          mu3addalTafa3ul: Math.round(mu3addal * 100) / 100,
        },
      });
      updatedCount++;
    } catch {
      // تجاهل الأخطاء الفردية والمتابعة مع المنشورات التالية
    }
  }

  return NextResponse.json({ tamm: true, updatedCount });
}
