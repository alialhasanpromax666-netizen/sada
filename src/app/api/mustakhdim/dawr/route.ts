/**
 * واجهة جلب دور المستخدم.
 *
 * GET /api/mustakhdim/dawr → { dawr: "MUSTAKHDIM" | "ADIM" }
 */
import { NextResponse } from "next/server";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";

export const runtime = "nodejs";

export async function GET() {
  try {
    const m = await jalbMustakhdimHali();
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim());
    const dawr = adminEmails.includes(m.email) ? "ADIM" : "MUSTAKHDIM";
    return NextResponse.json({ dawr });
  } catch {
    return NextResponse.json({ dawr: "MUSTAKHDIM" });
  }
}
