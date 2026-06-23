/**
 * صَدَى — تهيئة قاعدة البيانات.
 * التشغيل:  npm run db:seed
 *
 * نسخة الإنتاج لا تُدخل أي بيانات تجريبية. يُنشأ صاحب الحساب تلقائياً
 * عند أول طلب (راجع jalbMustakhdimHali)، وتُضاف الوكلاء والمفاتيح
 * والمنشورات من داخل التطبيق. هذا الملف موجود كنقطة امتداد لأي تهيئة
 * إنتاجية مستقبلية (أدوار، فئات افتراضية… إلخ).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("صَدَى — قاعدة البيانات جاهزة (بلا بيانات تجريبية).");
}

main()
  .catch((e) => {
    console.error("فشلت التهيئة:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
