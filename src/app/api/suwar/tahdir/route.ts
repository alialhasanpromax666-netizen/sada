/**
 * واجهة معالجة الصور — تجلب صورة من Pexels وتضع عليها الإطار.
 *
 * POST /api/suwar/tahdir  { mawdu?, kalimaMiftahiyah? }
 *   → { suwar: [{ rabit, ism }] }
 *
 * تتطلّب مفتاح Pexels في البيئة: PEXELS_API_KEY
 */
import { NextResponse } from "next/server";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { preparePostImage, saveImage } from "@/lib/suwar/suwar";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const m = await jalbMustakhdimHali();
  const body = (await req.json()) as {
    mawdu?: string;
    kalimatMiftahiyah?: string[];
    url?: string;
    qanat?: string;
  };

  const miftahPexels = process.env.PEXELS_API_KEY;
  if (!miftahPexels) {
    return NextResponse.json(
      { khata: "مفتاح Pexels غير مهيّأ. أضِف PEXELS_API_KEY في البيئة." },
      { status: 500 },
    );
  }

  // تحديد الكلمات المفتاحية للبحث
  const kalimat = body.kalimatMiftahiyah ?? [body.mawdu ?? "business"];
  const natayij: { rabit: string; ism: string }[] = [];

  for (const kalima of kalimat.slice(0, 3)) {
    const suora = await preparePostImage(kalima, miftahPexels, {
      url: body.url,
      channel: body.qanat,
    });
    if (!suora) continue;

    const rabit = await saveImage(suora, "manshur");
    natayij.push({ rabit, ism: kalima });
  }

  if (natayij.length === 0) {
    return NextResponse.json(
      { khata: `لم يتم العثور على صور للكلمة: "${kalimat[0]}"` },
      { status: 404 },
    );
  }

  return NextResponse.json({ suwar: natayij });
}
