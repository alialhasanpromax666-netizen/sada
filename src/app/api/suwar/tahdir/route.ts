/**
 * واجهة معالجة الصور — تنشئ إطراً أزرقاً مع نصوص.
 *
 * POST /api/suwar/tahdir  { url?, qanat? }
 *   → { suwar: [{ rabit, ism }] }
 */
import { NextResponse } from "next/server";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { createFrameImage, saveImage } from "@/lib/suwar/suwar";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const m = await jalbMustakhdimHali();
    const body = (await req.json()) as {
      url?: string;
      qanat?: string;
    };

    // إنشاء الإطار مباشرة (بدون Pexels)
    const buffer = await createFrameImage({
      url: body.url,
      channel: body.qanat,
    });

    const rabit = await saveImage(buffer, "sada-frame");

    return NextResponse.json({ suwar: [{ rabit, ism: "sada-frame" }] });
  } catch (e) {
    console.error("suwar/tahdir خطأ:", e);
    return NextResponse.json(
      { khata: (e as Error).message ?? "خطأ داخلي في معالجة الصور" },
      { status: 500 },
    );
  }
}
