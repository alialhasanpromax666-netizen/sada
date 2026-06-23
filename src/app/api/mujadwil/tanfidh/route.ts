/**
 * واجهة المُجدْوِل — تنفيذ المنشورات المستحقّة.
 *
 * GET  /api/mujadwil/tanfidh  → عدد المنشورات المجدولة التي حان موعدها.
 * POST /api/mujadwil/tanfidh  → ينشر كل منشور مجدول حان موعده الآن.
 *
 * يُكمل هذا وعد «النشر التلقائي»: في الإنتاج يُستدعى دورياً عبر مُشغّل
 * خلفي (cron) — مثال:  curl -X POST https://…/api/mujadwil/tanfidh
 * أمّا هنا فيُطلَق يدوياً من صفحة الجدولة أيضاً.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { naffidhNashr } from "@/lib/nashir/tanfidh";

export const runtime = "nodejs";

/** يجلب المنشورات المجدولة التي حان موعدها (حدّ أقصى 25 دفعةً واحدة). */
async function jalbMustahaqqa(mustakhdimId: string) {
  return db.manshur.findMany({
    where: {
      wakeel: { mustakhdimId },
      hala: "MAJDWAL",
      mawiidNashr: { lte: new Date() },
    },
    select: { id: true },
    orderBy: { mawiidNashr: "asc" },
    take: 25,
  });
}

export async function GET() {
  const m = await jalbMustakhdimHali();
  const mustahaqqa = await jalbMustahaqqa(m.id);
  return NextResponse.json({ mustahaqqa: mustahaqqa.length });
}

export async function POST() {
  const m = await jalbMustakhdimHali();
  const mustahaqqa = await jalbMustahaqqa(m.id);

  let najah = 0;
  let fashil = 0;
  // نشر تسلسلي للحفاظ على ترتيب الإشعارات وتجنّب إغراق المنصّات.
  for (const p of mustahaqqa) {
    const r = await naffidhNashr(p.id, m.id);
    if (r.najah) najah++;
    else fashil++;
  }

  return NextResponse.json({ mustahaqqa: mustahaqqa.length, najah, fashil });
}
