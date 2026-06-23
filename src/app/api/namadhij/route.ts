/**
 * واجهة قائمة النماذج — تُغذّي مُنتقي النموذج في معالج إنشاء الوكيل.
 *
 * GET /api/namadhij?muzawwid=OPENROUTER → { namadhij: string[], masdar }
 *
 * - BYNARA: تُرجِع النماذج المقترحة الثابتة.
 * - OPENROUTER: تجلب القائمة الحيّة من OpenRouter بمفتاح المستخدم المفعّل
 *   (إن وُجد)، وإلّا تعود للنماذج المقترحة.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kashf } from "@/lib/tashfeer";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { MUZAWWIDUN, type MuzawwidAql } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const muzawwid = (searchParams.get("muzawwid") ?? "BYNARA") as MuzawwidAql;
  const wasf = MUZAWWIDUN[muzawwid];
  if (!wasf) {
    return NextResponse.json({ khata: "مزوّد غير معروف." }, { status: 400 });
  }

  // الافتراضي: النماذج المقترحة الثابتة.
  const ihtiyati = wasf.namadhijMuqtaraha;

  if (muzawwid !== "OPENROUTER") {
    return NextResponse.json({ namadhij: ihtiyati, masdar: "muqtarah" });
  }

  // OpenRouter: حاول جلب القائمة الحيّة بمفتاح المستخدم.
  const m = await jalbMustakhdimHali();
  const miftah = await db.miftah.findFirst({
    where: { mustakhdimId: m.id, manassa: "OPENROUTER", fa3aal: true },
    orderBy: { createdAt: "desc" },
  });

  if (!miftah) {
    return NextResponse.json({ namadhij: ihtiyati, masdar: "muqtarah" });
  }

  try {
    const sirr = kashf(miftah.qimaMushaffara);
    const radd = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${sirr}` },
    });
    if (!radd.ok) {
      return NextResponse.json({ namadhij: ihtiyati, masdar: "muqtarah" });
    }
    const data = (await radd.json()) as { data?: { id: string }[] };
    const hayy = (data.data ?? [])
      .map((x) => x.id)
      .filter(Boolean)
      .sort();
    if (hayy.length === 0) {
      return NextResponse.json({ namadhij: ihtiyati, masdar: "muqtarah" });
    }
    return NextResponse.json({ namadhij: hayy, masdar: "live" });
  } catch {
    return NextResponse.json({ namadhij: ihtiyati, masdar: "muqtarah" });
  }
}
