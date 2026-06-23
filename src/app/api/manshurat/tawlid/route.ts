/**
 * واجهة توليد المحتوى — يستدعي "العقل" لصياغة منشورات بصوت الوكيل،
 * عبر مزوّد الوكيل ونموذجه ومعرفته المرجعية.
 *
 * POST /api/manshurat/tawlid  { wakeelId, manassa, mawdu?, adad? }
 *      → { manshurat: string[] }
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { tawlidMuhtawa } from "@/lib/aql/aql";
import { jalbMiftahAql } from "@/lib/aql/miftah";
import type { RamzManassa, ShakhsiyyaWakeel, MuzawwidAql } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { wakeelId, manassa, mawdu, adad } = (await req.json()) as {
    wakeelId?: string;
    manassa?: RamzManassa;
    mawdu?: string;
    adad?: number;
  };

  if (!wakeelId || !manassa) {
    return NextResponse.json(
      { khata: "الحقول المطلوبة: wakeelId، manassa." },
      { status: 400 },
    );
  }

  const m = await jalbMustakhdimHali();
  const wakeel = await db.wakeel.findFirst({
    where: { id: wakeelId, mustakhdimId: m.id },
  });
  if (!wakeel) {
    return NextResponse.json({ khata: "الوكيل غير موجود." }, { status: 404 });
  }

  const muzawwid: MuzawwidAql =
    wakeel.muzawwid === "OPENROUTER" ? "OPENROUTER" : "BYNARA";
  const miftahAql = await jalbMiftahAql(m.id, muzawwid);

  try {
    const manshurat = await tawlidMuhtawa({
      wakeel: {
        ism: wakeel.ism,
        wasf: wakeel.wasf,
        takhassus: wakeel.takhassus,
        shakhsiyya: JSON.parse(wakeel.shakhsiyya) as ShakhsiyyaWakeel,
        maarifa: wakeel.maarifa,
      },
      manassa,
      mawdu,
      adad,
      muzawwid,
      namudhaj: wakeel.namudhaj,
      miftah: miftahAql,
    });

    return NextResponse.json({ manshurat });
  } catch (e) {
    return NextResponse.json({ khata: (e as Error).message }, { status: 500 });
  }
}
