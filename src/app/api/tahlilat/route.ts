/**
 * واجهة التحليلات — تجمّع مؤشّرات الأداء لرسوم لوحة التحليلات.
 *
 * GET /api/tahlilat → {
 *   ijmali,        // المجاميع الكلية
 *   hasabManassa,  // التوزيع حسب المنصّة
 *   tawziHala,     // عدد المنشورات حسب الحالة
 *   silsila        // سلسلة أداء آخر المنشورات
 * }
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";

export const runtime = "nodejs";

export async function GET() {
  const m = await jalbMustakhdimHali();

  // كل منشورات المستخدم مع تحليلاتها.
  const manshurat = await db.manshur.findMany({
    where: { wakeel: { mustakhdimId: m.id } },
    include: { tahlil: true, wakeel: { select: { ism: true } } },
    orderBy: { nushiraFi: "desc" },
  });

  // المجاميع الكلية.
  const ijmali = manshurat.reduce(
    (acc, p) => {
      if (p.tahlil) {
        acc.mushahadat += p.tahlil.mushahadat;
        acc.i3jabat += p.tahlil.i3jabat;
        acc.musharakat += p.tahlil.musharakat;
        acc.ta3liqat += p.tahlil.ta3liqat;
      }
      return acc;
    },
    { mushahadat: 0, i3jabat: 0, musharakat: 0, ta3liqat: 0, manshurat: manshurat.length },
  );

  // التوزيع حسب المنصّة.
  const khariteManassa = new Map<string, { mushahadat: number; tafa3ul: number; adad: number }>();
  for (const p of manshurat) {
    const cur = khariteManassa.get(p.manassa) ?? { mushahadat: 0, tafa3ul: 0, adad: 0 };
    cur.adad += 1;
    if (p.tahlil) {
      cur.mushahadat += p.tahlil.mushahadat;
      cur.tafa3ul += p.tahlil.i3jabat + p.tahlil.musharakat + p.tahlil.ta3liqat;
    }
    khariteManassa.set(p.manassa, cur);
  }
  const hasabManassa = Array.from(khariteManassa.entries()).map(([manassa, v]) => ({
    manassa,
    ...v,
  }));

  // التوزيع حسب الحالة.
  const khariteHala = new Map<string, number>();
  for (const p of manshurat) {
    khariteHala.set(p.hala, (khariteHala.get(p.hala) ?? 0) + 1);
  }
  const tawziHala = Array.from(khariteHala.entries()).map(([hala, adad]) => ({
    hala,
    adad,
  }));

  // سلسلة أداء آخر 10 منشورات منشورة (للرسم الخطّي/العمودي).
  const silsila = manshurat
    .filter((p) => p.tahlil && p.nushiraFi)
    .slice(0, 10)
    .reverse()
    .map((p) => ({
      maerif: p.id.slice(-4),
      wakeel: p.wakeel.ism,
      manassa: p.manassa,
      mushahadat: p.tahlil!.mushahadat,
      i3jabat: p.tahlil!.i3jabat,
      musharakat: p.tahlil!.musharakat,
      mu3addal: p.tahlil!.mu3addalTafa3ul,
    }));

  return NextResponse.json({ ijmali, hasabManassa, tawziHala, silsila });
}
