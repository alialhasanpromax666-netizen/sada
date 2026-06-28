/**
 * لوحة التحكم الرئيسية — نظرة شاملة على المنظومة.
 * مكوّن خادمي يقرأ قاعدة البيانات مباشرة (بلا رحلة API).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { MANASSAT, type RamzManassa } from "@/lib/types";
import {
  AyqunaWukala,
  AyqunaNashr,
  AyqunaAyn,
  AyqunaTafa3ul,
  AyqunaManassa,
} from "@/components/Ayqunat";

export const dynamic = "force-dynamic";

function raqamMukhtasar(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ألف";
  return String(n);
}

export default async function Dashboard() {
  let m;
  try {
    m = await jalbMustakhdimHali();
  } catch {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-400">جاري التحميل...</p>
      </div>
    );
  }

  const [wukala, manshurat, tahlilat] = await Promise.all([
    db.wakeel.findMany({
      where: { mustakhdimId: m.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { manshurat: true } } },
    }),
    db.manshur.findMany({
      where: { wakeel: { mustakhdimId: m.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { wakeel: { select: { ism: true } } },
    }),
    db.tahlil.findMany({ where: { manshur: { wakeel: { mustakhdimId: m.id } } } }),
  ]);

  const adadNashit = wukala.filter((w) => w.hala === "NASHIT").length;
  const manshurMansoor = await db.manshur.count({
    where: { wakeel: { mustakhdimId: m.id }, hala: "MANSHUR" },
  });
  const ijmaliMushahadat = tahlilat.reduce((s, t) => s + t.mushahadat, 0);
  const ijmaliTafa3ul = tahlilat.reduce(
    (s, t) => s + t.i3jabat + t.musharakat + t.ta3liqat,
    0,
  );

  const bitaqat: { ism: string; qima: string; Ayquna: (p: { className?: string }) => ReactNode; lawn: string }[] = [
    { ism: "وكلاء نشطون", qima: `${adadNashit}/${wukala.length}`, Ayquna: AyqunaWukala, lawn: "from-aql to-aql-deep" },
    { ism: "منشورات منشورة", qima: raqamMukhtasar(manshurMansoor), Ayquna: AyqunaNashr, lawn: "from-sada to-sada-deep" },
    { ism: "إجمالي المشاهدات", qima: raqamMukhtasar(ijmaliMushahadat), Ayquna: AyqunaAyn, lawn: "from-blue-400 to-blue-700" },
    { ism: "إجمالي التفاعل", qima: raqamMukhtasar(ijmaliTafa3ul), Ayquna: AyqunaTafa3ul, lawn: "from-wameed to-amber-600" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* الترويسة */}
      <header className="animate-sariyan">
        <h2 className="font-display text-3xl font-extrabold text-white">
          أهلاً، {m.ism}
        </h2>
        <p className="mt-1 text-slate-400">
          هذه لوحة قيادة صداك الرقمي. تابع وكلاءك ونبض منشوراتك من مكان واحد.
        </p>
      </header>

      {/* بطاقات الإحصاء */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {bitaqat.map((b) => (
          <div key={b.ism} className="bitaqa animate-sariyan p-5">
            <div
              className={`mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${b.lawn} text-white shadow-lg`}
            >
              <b.Ayquna className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-white">{b.qima}</p>
            <p className="text-sm text-slate-400">{b.ism}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* الوكلاء */}
        <section className="bitaqa lg:col-span-3 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">وكلاؤك</h3>
            <Link href="/wukala" className="text-sm text-sada hover:underline">
              عرض الكل →
            </Link>
          </div>

          {wukala.length === 0 ? (
            <Faragh
              matn="لا وكلاء بعد. أنشئ أول وكيل ذكي ليبدأ النشر نيابةً عنك."
              rabit="/wukala/jadeed"
              zir="إنشاء وكيل"
            />
          ) : (
            <ul className="space-y-3">
              {wukala.slice(0, 4).map((w) => {
                const manassat = JSON.parse(w.manassat) as RamzManassa[];
                return (
                  <li
                    key={w.id}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-layli-900/40 p-3"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-aql/15 text-aql">
                      <AyqunaWukala className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{w.ism}</p>
                      <p className="truncate text-xs text-slate-400">{w.takhassus}</p>
                    </div>
                    <div className="flex gap-1">
                      {manassat.map((mn) => (
                        <span
                          key={mn}
                          className="grid h-6 w-6 place-items-center rounded-md"
                          style={{ background: MANASSAT[mn].lawn + "22", color: MANASSAT[mn].lawn }}
                          title={MANASSAT[mn].ism}
                        >
                          <AyqunaManassa ramz={mn} className="h-3.5 w-3.5" />
                        </span>
                      ))}
                    </div>
                    <HalaWasm hala={w.hala} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* أحدث المنشورات */}
        <section className="bitaqa lg:col-span-2 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">أحدث المنشورات</h3>
          {manshurat.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">لا منشورات بعد.</p>
          ) : (
            <ul className="space-y-3">
              {manshurat.map((p) => (
                <li key={p.id} className="rounded-xl border border-white/5 bg-layli-900/40 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-aql">{p.wakeel.ism}</span>
                    <HalaManshurWasm hala={p.hala} />
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-300">{p.matn}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Faragh({ matn, rabit, zir }: { matn: string; rabit: string; zir: string }) {
  return (
    <div className="grid place-items-center gap-3 py-10 text-center">
      <AyqunaWukala className="h-10 w-10 text-slate-600" />
      <p className="max-w-xs text-sm text-slate-400">{matn}</p>
      <Link href={rabit} className="zir-asasi">
        {zir}
      </Link>
    </div>
  );
}

function HalaWasm({ hala }: { hala: string }) {
  const map: Record<string, [string, string]> = {
    NASHIT: ["نشِط", "bg-sada/15 text-sada-soft"],
    NAA_IM: ["نائم", "bg-slate-500/15 text-slate-400"],
    MUAALLAQ: ["معلّق", "bg-wameed/15 text-wameed-soft"],
  };
  const [ism, cls] = map[hala] ?? ["—", ""];
  return <span className={`wasm ${cls}`}>{ism}</span>;
}

function HalaManshurWasm({ hala }: { hala: string }) {
  const map: Record<string, [string, string]> = {
    MANSHUR: ["منشور", "bg-sada/15 text-sada-soft"],
    MAJDWAL: ["مجدول", "bg-aql/15 text-aql"],
    MUSAWWADA: ["مسوّدة", "bg-slate-500/15 text-slate-400"],
    QAYD_NASHR: ["قيد النشر", "bg-wameed/15 text-wameed-soft"],
    FASHIL: ["فشل", "bg-rose-500/15 text-rose-300"],
  };
  const [ism, cls] = map[hala] ?? ["—", ""];
  return <span className={`wasm ${cls}`}>{ism}</span>;
}
