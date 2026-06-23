import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MASARAT_MAFTUHA = [
  "/idkhal",
  "/api/auth",
  "/api/telegram/webhook",
  "/_next",
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // مسارات مفتوحة بدون مصادقة
  if (MASARAT_MAFTUHA.some((p) => pathname.startsWith(p) || pathname === p)) {
    return NextResponse.next();
  }

  // السماح لـ cron-job.org عبر header سري
  if (pathname.startsWith("/api/mujadwil/tanfidh")) {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
      return NextResponse.next();
    }
  }

  const sirr = process.env.NEXTAUTH_SECRET;
  if (!sirr) {
    console.warn("⚠ NEXTAUTH_SECRET غير مضبوط — تفعيل وضع التجاوز المؤقّت");
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: sirr });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/idkhal";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
