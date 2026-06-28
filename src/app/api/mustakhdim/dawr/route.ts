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
    return NextResponse.json({ dawr: m.dawr ?? "MUSTAKHDIM" });
  } catch {
    return NextResponse.json({ dawr: "MUSTAKHDIM" });
  }
}
