/**
 * الهَيْكل (Haykal) — عناصر تحميل نائبة (Skeletons).
 * توهّج «لمعان» ينساب فوق صندوق باهت ليُشعر المستخدم بأن المحتوى قادم،
 * بدل نصّ «جارٍ التحميل…» الجامد. متوافق مع الاتجاه من اليمين لليسار.
 */

export function Haykal({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-white/5 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-lamaan bg-gradient-to-l from-transparent via-white/10 to-transparent" />
    </div>
  );
}

/** هيكل بطاقة وكيل — يحاكي شبكة بطاقات الوكلاء أثناء التحميل. */
export function HaykalBitaqa() {
  return (
    <div className="bitaqa flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <Haykal className="h-12 w-12 rounded-2xl" />
        <Haykal className="h-5 w-14 rounded-full" />
      </div>
      <Haykal className="h-5 w-2/3" />
      <Haykal className="h-3 w-1/3" />
      <Haykal className="h-3 w-full" />
      <div className="mt-2 flex gap-1.5">
        <Haykal className="h-7 w-7 rounded-lg" />
        <Haykal className="h-7 w-7 rounded-lg" />
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
        <Haykal className="h-3 w-16" />
        <Haykal className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/** هيكل سطر قائمة — للمفاتيح والمنشورات. */
export function HaykalSatr() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-layli-900/40 p-3">
      <Haykal className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Haykal className="h-4 w-1/3" />
        <Haykal className="h-3 w-1/2" />
      </div>
      <Haykal className="h-6 w-16 rounded-full" />
    </div>
  );
}
