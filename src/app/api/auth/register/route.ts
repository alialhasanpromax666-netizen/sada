import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { ism, email, kalimaSirr } = (await req.json()) as {
    ism?: string;
    email?: string;
    kalimaSirr?: string;
  };

  if (!ism || !email || !kalimaSirr) {
    return NextResponse.json(
      { khata: "الحقول المطلوبة: ism، email، kalimaSirr." },
      { status: 400 },
    );
  }

  if (kalimaSirr.length < 6) {
    return NextResponse.json(
      { khata: "كلمة السر يجب أن تكون 6 أحرف على الأقل." },
      { status: 400 },
    );
  }

  const mawjud = await db.mustakhdim.findUnique({ where: { email } });
  if (mawjud) {
    return NextResponse.json(
      { khata: "البريد الإلكتروني مستخدم بالفعل." },
      { status: 409 },
    );
  }

  const mashfura = await bcrypt.hash(kalimaSirr, 12);

  const mustakhdim = await db.mustakhdim.create({
    data: { ism, email, kalimaSirr: mashfura },
    select: { id: true, ism: true, email: true, createdAt: true },
  });

  return NextResponse.json({ mustakhdim }, { status: 201 });
}
