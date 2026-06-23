/**
 * واجهة النشر الفوري — تنشر منشوراً على منصّته عبر المحوّل المناسب.
 *
 * POST /api/manshurat/:id/nashr  → ينفّذ النشر ويحدّث الحالة.
 *
 * المنطق الفعلي يعيش في naffidhNashr (lib/nashir/tanfidh) ليتشارك مع
 * المُجدْوِل التلقائي. هذه الواجهة غلاف رفيع يتحقّق من المستخدم الحالي.
 */
import { NextResponse } from "next/server";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { naffidhNashr } from "@/lib/nashir/tanfidh";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  const natija = await naffidhNashr(params.id, m.id);

  const halaHTTP = natija.najah
    ? 200
    : natija.khata === "المنشور غير موجود."
      ? 404
      : 502;

  return NextResponse.json(natija, { status: halaHTTP });
}
