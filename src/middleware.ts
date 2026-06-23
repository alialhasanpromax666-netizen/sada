import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // السماح لـ cron-job.org عبر header سري
      if (req.nextUrl.pathname.startsWith("/api/mujadwil/tanfidh")) {
        const cronSecret = req.headers.get("x-cron-secret");
        if (cronSecret && cronSecret === process.env.CRON_SECRET) return true;
      }
      // مسارات المصادقة مفتوحة للجميع
      if (req.nextUrl.pathname.startsWith("/api/auth")) return true;
      if (req.nextUrl.pathname === "/idkhal") return true;
      // الملفات الثابتة
      if (req.nextUrl.pathname.startsWith("/_next")) return true;
      if (req.nextUrl.pathname === "/favicon.ico") return true;
      // بقية المسارات تتطلب توكن صالح
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
