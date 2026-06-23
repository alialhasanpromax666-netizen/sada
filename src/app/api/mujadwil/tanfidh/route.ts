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
import { NextRequest, NextResponse } from "next/server";
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

/** يتحقّق من صحة مفتاح cron ويعيد قائمة معرّفات المستخدمين، أو null إن كان الطلب غير مصرّح به. */
async function mustakhdimunMinCron(req: NextRequest): Promise<string[] | null> {
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) return null;
  const kull = await db.mustakhdim.findMany({ select: { id: true } });
  return kull.map((u) => u.id);
}

export async function GET(req: NextRequest) {
  const ids = await mustakhdimunMinCron(req);
  if (ids) {
    // نداء cron: اجمع المستحقّ لكل المستخدمين
    let majmuc = 0;
    for (const id of ids) {
      const q = await jalbMustahaqqa(id);
      majmuc += q.length;
    }
    return NextResponse.json({ mustahaqqa: majmuc });
  }
  const m = await jalbMustakhdimHali();
  const mustahaqqa = await jalbMustahaqqa(m.id);
  return NextResponse.json({ mustahaqqa: mustahaqqa.length });
}

export async function POST(req: NextRequest) {
  const ids = await mustakhdimunMinCron(req);
  if (ids) {
    // نداء cron: انشر المستحقّ لكل المستخدمين
    let najah = 0;
    let fashil = 0;
    let majmuc = 0;
    for (const id of ids) {
      const mustahaqqa = await jalbMustahaqqa(id);
      majmuc += mustahaqqa.length;
      for (const p of mustahaqqa) {
        const r = await naffidhNashr(p.id, id);
        if (r.najah) najah++;
        else fashil++;
      }
    }
    return NextResponse.json({ mustahaqqa: majmuc, najah, fashil });
  }
  // طلب من المتصفح (جلسة عادية)
  const m = await jalbMustakhdimHali();
  const mustahaqqa = await jalbMustahaqqa(m.id);
  let najah = 0;
  let fashil = 0;
  for (const p of mustahaqqa) {
    const r = await naffidhNashr(p.id, m.id);
    if (r.najah) najah++;
    else fashil++;
  }
  return NextResponse.json({ mustahaqqa: mustahaqqa.length, najah, fashil });
}
