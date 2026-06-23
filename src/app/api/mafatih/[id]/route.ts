/**
 * واجهة مفتاح مفرد — حذف وتفعيل/تعطيل (تدوير).
 *
 * DELETE /api/mafatih/:id           → حذف المفتاح
 * PATCH  /api/mafatih/:id  {fa3aal} → تفعيل/تعطيل
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  await db.miftah.deleteMany({
    where: { id: params.id, mustakhdimId: m.id },
  });
  return NextResponse.json({ tamm: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  const { fa3aal } = (await req.json()) as { fa3aal?: boolean };

  await db.miftah.updateMany({
    where: { id: params.id, mustakhdimId: m.id },
    data: { fa3aal: Boolean(fa3aal) },
  });
  return NextResponse.json({ tamm: true });
}
