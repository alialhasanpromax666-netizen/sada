/**
 * واجهة إحصائيات الأدمين — تُرجع عدد المستخدمين والوكلاء والمنشورات.
 *
 * GET /api/admin/ihsaiyyat
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";

export const runtime = "nodejs";

export async function GET() {
  try {
    const m = await jalbMustakhdimHali();
    
    // التحقق من صلاحية الأدمين
    if (m.dawr !== "ADIM") {
      return NextResponse.json(
        { khata: "غير مصرّح. هذه الواجهة للأدمين فقط." },
        { status: 403 },
      );
    }

    // جلب الإحصائيات
    const [
      adadMustakhdimin,
      adadWukala,
      adadManshurat,
      adadManashir,
      adadFashila,
      mustakhdimun,
    ] = await Promise.all([
      db.mustakhdim.count(),
      db.wakeel.count(),
      db.manshur.count(),
      db.manshur.count({ where: { hala: "MANSHUR" } }),
      db.manshur.count({ where: { hala: "FASHIL" } }),
      db.mustakhdim.findMany({
        select: {
          id: true,
          ism: true,
          email: true,
          dawr: true,
          createdAt: true,
          _count: {
            select: {
              wukala: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // جلب عدد المنشورات لكل مستخدم
    const mustakhdimunMaAladad = await Promise.all(
      mustakhdimun.map(async (mu) => {
        const adadManshurat = await db.manshur.count({
          where: { wakeel: { mustakhdimId: mu.id } },
        });
        return {
          id: mu.id,
          ism: mu.ism,
          email: mu.email,
          dawr: mu.dawr,
          createdAt: mu.createdAt.toISOString(),
          adadWukala: mu._count.wukala,
          adadManshurat,
        };
      }),
    );

    return NextResponse.json({
      adadMustakhdimin,
      adadWukala,
      adadManshurat,
      adadManashir,
      adadFashila,
      mustakhdimun: mustakhdimunMaAladad,
    });
  } catch (e) {
    return NextResponse.json(
      { khata: (e as Error).message },
      { status: 500 },
    );
  }
}
