/**
 * واجهة منشور مفرد — تعديل أو حذف منشور.
 *
 * PATCH  /api/manshurat/:id  { matn?, mawiidNashr?, hala? }
 * DELETE /api/manshurat/:id
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  const body = (await req.json()) as {
    matn?: string;
    mawiidNashr?: string | null;
    hala?: string;
  };

  await db.manshur.updateMany({
    where: { id: params.id, wakeel: { mustakhdimId: m.id } },
    data: {
      ...(body.matn !== undefined ? { matn: body.matn } : {}),
      ...(body.mawiidNashr !== undefined
        ? { mawiidNashr: body.mawiidNashr ? new Date(body.mawiidNashr) : null }
        : {}),
      ...(body.hala !== undefined ? { hala: body.hala } : {}),
    },
  });

  return NextResponse.json({ tamm: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  await db.manshur.deleteMany({
    where: { id: params.id, wakeel: { mustakhdimId: m.id } },
  });
  return NextResponse.json({ tamm: true });
}
