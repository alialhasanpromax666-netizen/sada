/**
 * قناة الإشعارات الفورية (Server-Sent Events).
 *
 * GET /api/isharat/bath  → تدفّق SSE يدفع كل إشعار جديد فور حدوثه.
 *
 * تتصل الواجهة بهذه القناة عبر EventSource وتستقبل الإشعارات حيّة
 * دون استطلاع متكرّر (polling).
 */
import { sajjilMustami } from "@/lib/hadath/hadath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const irsal = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* القناة مغلقة */
        }
      };

      // فتح القناة.
      controller.enqueue(encoder.encode(`: متّصل بصدى\n\n`));

      // التسجيل في ناقل الأحداث.
      const ilghaa = sajjilMustami(irsal);

      // نبضة حياة كل 25 ثانية لإبقاء الاتصال مفتوحاً عبر الوسطاء.
      const nabd = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: نبضة\n\n`));
        } catch {
          /* مغلق */
        }
      }, 25000);

      // التنظيف عند إغلاق العميل للاتصال.
      req.signal.addEventListener("abort", () => {
        clearInterval(nabd);
        ilghaa();
        try {
          controller.close();
        } catch {
          /* مغلق مسبقاً */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
