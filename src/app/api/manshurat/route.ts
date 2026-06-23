/**
 * واجهة المنشورات — قائمة وحفظ (مسوّدة/مجدول).
 *
 * GET  /api/manshurat?hala=  → قائمة منشورات المستخدم
 * POST /api/manshurat        → حفظ منشور (مسوّدة أو مجدول)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import type { ManshurHala } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const m = await jalbMustakhdimHali();
  const { searchParams } = new URL(req.url);
  const hala = searchParams.get("hala") as ManshurHala | null;

  const manshurat = await db.manshur.findMany({
    where: {
      wakeel: { mustakhdimId: m.id },
      ...(hala ? { hala } : {}),
    },
    orderBy: [{ mawiidNashr: "asc" }, { createdAt: "desc" }],
    include: {
      wakeel: { select: { id: true, ism: true } },
      tahlil: true,
    },
  });

  return NextResponse.json({ manshurat });
}

export async function POST(req: Request) {
  const { wakeelId, manassa, matn, mawiidNashr } = (await req.json()) as {
    wakeelId?: string;
    manassa?: string;
    matn?: string;
    mawiidNashr?: string | null;
  };

  if (!wakeelId || !manassa || !matn) {
    return NextResponse.json(
      { khata: "الحقول المطلوبة: wakeelId، manassa، matn." },
      { status: 400 },
    );
  }

  const m = await jalbMustakhdimHali();
  // تأكيد ملكيّة الوكيل.
  const wakeel = await db.wakeel.findFirst({
    where: { id: wakeelId, mustakhdimId: m.id },
    select: { id: true },
  });
  if (!wakeel) {
    return NextResponse.json({ khata: "الوكيل غير موجود." }, { status: 404 });
  }

  const manshur = await db.manshur.create({
    data: {
      wakeelId,
      manassa,
      matn,
      mawiidNashr: mawiidNashr ? new Date(mawiidNashr) : null,
      hala: mawiidNashr ? "MAJDWAL" : "MUSAWWADA",
    },
  });

  return NextResponse.json({ manshur }, { status: 201 });
}
