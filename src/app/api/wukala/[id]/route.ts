/**
 * واجهة وكيل مفرد — تحديث الحالة/التشغيل التلقائي وحذف الوكيل.
 *
 * PATCH  /api/wukala/:id  {hala?, awtomatiki?}
 * DELETE /api/wukala/:id
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import type { WakeelHala } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  const { hala, awtomatiki, maarifa, khitaShahri, muzawwid, namudhaj, ism, wasf, takhassus, shakhsiyya, manassat } =
    (await req.json()) as {
      hala?: WakeelHala;
      awtomatiki?: boolean;
      maarifa?: string;
      khitaShahri?: string;
      muzawwid?: string;
      namudhaj?: string;
      ism?: string;
      wasf?: string;
      takhassus?: string;
      shakhsiyya?: Record<string, unknown>;
      manassat?: string[];
    };

  await db.wakeel.updateMany({
    where: { id: params.id, mustakhdimId: m.id },
    data: {
      ...(hala ? { hala } : {}),
      ...(awtomatiki !== undefined ? { awtomatiki } : {}),
      ...(maarifa !== undefined
        ? { maarifa: maarifa.trim() ? maarifa.trim() : null }
        : {}),
      ...(khitaShahri !== undefined
        ? { khitaShahri: khitaShahri.trim() ? khitaShahri.trim() : null }
        : {}),
      ...(muzawwid !== undefined
        ? { muzawwid: ["OPENROUTER", "BYNARA"].includes(muzawwid) ? muzawwid : "ANTHROPIC" }
        : {}),
      ...(namudhaj !== undefined
        ? { namudhaj: namudhaj.trim() ? namudhaj.trim() : null }
        : {}),
      ...(ism ? { ism } : {}),
      ...(wasf !== undefined ? { wasf } : {}),
      ...(takhassus ? { takhassus } : {}),
      ...(shakhsiyya ? { shakhsiyya: JSON.stringify(shakhsiyya) } : {}),
      ...(manassat ? { manassat: JSON.stringify(manassat) } : {}),
    },
  });
  return NextResponse.json({ tamm: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const m = await jalbMustakhdimHali();
  await db.wakeel.deleteMany({
    where: { id: params.id, mustakhdimId: m.id },
  });
  return NextResponse.json({ tamm: true });
}
