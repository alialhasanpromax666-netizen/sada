/**
 * واجهة خزنة المفاتيح — قائمة وإضافة المفاتيح.
 *
 * GET  /api/mafatih   → قائمة المفاتيح (مُقنّعة، بلا كشف الأسرار)
 * POST /api/mafatih   → إضافة مفتاح جديد (يُشفّر قبل التخزين)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taamin, basma, tashfeerJahiz } from "@/lib/tashfeer";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { ansha2Ishaar } from "@/lib/isharat";

// طبقة النواة تستخدم Node crypto — نفرض بيئة Node.
export const runtime = "nodejs";

export async function GET() {
  const m = await jalbMustakhdimHali();
  const mafatih = await db.miftah.findMany({
    where: { mustakhdimId: m.id },
    orderBy: { createdAt: "desc" },
    // لا نُرجِع qimaMushaffara أبداً إلى الواجهة.
    select: {
      id: true,
      manassa: true,
      laqab: true,
      basma: true,
      fa3aal: true,
      akhirIstikhdam: true,
      marratIstikhdam: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ mafatih });
}

export async function POST(req: Request) {
  if (!tashfeerJahiz()) {
    return NextResponse.json(
      { khata: "التشفير غير مهيّأ. عرّف SADA_MASTER_KEY في البيئة." },
      { status: 500 },
    );
  }

  const { manassa, laqab, sirr } = (await req.json()) as {
    manassa?: string;
    laqab?: string;
    sirr?: string;
  };

  if (!manassa || !laqab || !sirr) {
    return NextResponse.json(
      { khata: "الحقول المطلوبة: manassa، laqab، sirr." },
      { status: 400 },
    );
  }

  const m = await jalbMustakhdimHali();

  // التشفير يحدث هنا — القيمة الخام لا تُكتب إلى القرص أبداً.
  const miftah = await db.miftah.create({
    data: {
      mustakhdimId: m.id,
      manassa,
      laqab,
      qimaMushaffara: taamin(sirr),
      basma: basma(sirr),
    },
    select: { id: true, manassa: true, laqab: true, basma: true, createdAt: true },
  });

  await ansha2Ishaar({
    mustakhdimId: m.id,
    naw3: "NAJAH",
    unwan: "أُضيف مفتاح بأمان",
    matn: `تمّ تشفير وتخزين مفتاح "${laqab}" لمنصّة ${manassa}.`,
  });

  return NextResponse.json({ miftah }, { status: 201 });
}
