/**
 * واجهة الوكلاء — قائمة وإنشاء الوكلاء الذكيين.
 *
 * GET  /api/wukala  → قائمة وكلاء المستخدم (مع عدّ المنشورات)
 * POST /api/wukala  → إنشاء وكيل جديد (مخرَج معالج الإنشاء)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { ansha2Ishaar } from "@/lib/isharat";

export const runtime = "nodejs";

export async function GET() {
  const m = await jalbMustakhdimHali();
  const wukala = await db.wakeel.findMany({
    where: { mustakhdimId: m.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { manshurat: true } } },
  });
  return NextResponse.json({ wukala });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    ism?: string;
    wasf?: string;
    takhassus?: string;
    mawdu?: string;
    adad?: number;
    shakhsiyya?: unknown;
    manassat?: string[];
    awtomatiki?: boolean;
    maarifa?: string;
    khitaShahri?: string;
    muzawwid?: string;
    namudhaj?: string;
  };

  if (!body.ism || !body.takhassus || !body.manassat?.length) {
    return NextResponse.json(
      { khata: "الحقول المطلوبة: ism، takhassus، manassat." },
      { status: 400 },
    );
  }

  const m = await jalbMustakhdimHali();
  const wakeel = await db.wakeel.create({
    data: {
      mustakhdimId: m.id,
      ism: body.ism,
      wasf: body.wasf ?? "",
      takhassus: body.takhassus,
      shakhsiyya: JSON.stringify(body.shakhsiyya ?? {}),
      manassat: JSON.stringify(body.manassat),
      awtomatiki: Boolean(body.awtomatiki),
      maarifa: body.maarifa?.trim() ? body.maarifa.trim() : null,
      khitaShahri: body.khitaShahri?.trim() ? body.khitaShahri.trim() : null,
      muzawwid: ["OPENROUTER", "BYNARA"].includes(body.muzawwid ?? "") ? body.muzawwid : "ANTHROPIC",
      namudhaj: body.namudhaj?.trim() ? body.namudhaj.trim() : null,
      hala: "NASHIT",
    },
  });

  await ansha2Ishaar({
    mustakhdimId: m.id,
    naw3: "NAJAH",
    unwan: "وُلِد وكيل جديد",
    matn: `الوكيل "${wakeel.ism}" جاهز للعمل في مجال ${wakeel.takhassus}.`,
  });

  return NextResponse.json({ wakeel }, { status: 201 });
}
