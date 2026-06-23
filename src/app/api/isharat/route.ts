/**
 * واجهة الإشعارات — قائمة وتعليم كمقروء.
 *
 * GET   /api/isharat   → أحدث الإشعارات + عدد غير المقروء
 * PATCH /api/isharat   → تعليم الكل كمقروء
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";

export const runtime = "nodejs";

export async function GET() {
  const m = await jalbMustakhdimHali();
  const [isharat, ghayrMaqru] = await Promise.all([
    db.ishaar.findMany({
      where: { mustakhdimId: m.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.ishaar.count({ where: { mustakhdimId: m.id, maqru: false } }),
  ]);
  return NextResponse.json({ isharat, ghayrMaqru });
}

export async function PATCH() {
  const m = await jalbMustakhdimHali();
  await db.ishaar.updateMany({
    where: { mustakhdimId: m.id, maqru: false },
    data: { maqru: true },
  });
  return NextResponse.json({ tamm: true });
}
