import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { tashfeerJahiz } from "@/lib/tashfeer";
import { khidmatManassa } from "@/lib/nashir";
import { KULL_MANASSAT } from "@/lib/types";
import {
  AyqunaIdadat,
  AyqunaTashfeer,
  AyqunaAql,
  AyqunaNashr,
  AyqunaManassa,
  AyqunaSah,
  AyqunaZaid,
} from "@/components/Ayqunat";

export const dynamic = "force-dynamic";

export default async function IdadatPage() {
  const m = await jalbMustakhdimHali();

  const [mafatih, adadWukala, adadManshurat] = await Promise.all([
    db.miftah.findMany({
      where: { mustakhdimId: m.id, fa3aal: true },
      select: { manassa: true },
    }),
    db.wakeel.count({ where: { mustakhdimId: m.id } }),
    db.manshur.count({ where: { wakeel: { mustakhdimId: m.id } } }),
  ]);

  const khidmatMufaala = new Set(mafatih.map((k) => k.manassa));

  const tashfeer = tashfeerJahiz();
  const aqlJahiz =
    khidmatMufaala.has("BYNARA") ||
    khidmatMufaala.has("OPENROUTER");
  const namudhaj = process.env.SADA_AQL_MODEL ?? "mistral-large";

  const aqsam: {
    Ayquna: (p: { className?: string }) => ReactNode;
    ism: string;
    jahiz: boolean;
    lawn: string;
    jayyid: string;
    sayyi: string;
  }[] = [
    {
      Ayquna: AyqunaTashfeer,
      ism: "التشفير",
      jahiz: tashfeer,
      lawn: "from-sada to-sada-deep",
      jayyid: "المفتاح الرئيسي مهيّأ — الأسرار تُشفّر بـ AES-256-GCM.",
      sayyi: "عرّف SADA_MASTER_KEY في البيئة لتفعيل تخزين المفاتيح بأمان.",
    },
    {
      Ayquna: AyqunaAql,
      ism: "العقل (Bynara / OpenRouter)",
      jahiz: aqlJahiz,
      lawn: "from-aql to-aql-deep",
      jayyid: `محرّك التوليد جاهز. النموذج الافتراضي: ${namudhaj}.`,
      sayyi: "أضِف مفتاح Bynara أو OpenRouter في خزنة المفاتيح.",
    },
    {
      Ayquna: AyqunaNashr,
      ism: "النشر",
      jahiz: true,
      lawn: "from-blue-400 to-blue-700",
      jayyid: "النشر الحقيقي مفعّل — تُستدعى واجهات المنصّات بمفاتيحك.",
      sayyi: "",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="animate-sariyan">
        <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          <AyqunaIdadat className="h-7 w-7 text-slate-300" /> الإعدادات
        </h2>
        <p className="mt-1 text-slate-400">
          صحّة منظومتك في لمحة — جاهزية التشفير والعقل والمنصّات.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {aqsam.map((a) => (
          <div key={a.ism} className="bitaqa animate-sariyan flex flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${a.lawn} text-white shadow-lg`}
              >
                <a.Ayquna className="h-5 w-5" />
              </div>
              <HalaNuqta jahiz={a.jahiz} />
            </div>
            <h3 className="font-bold text-white">{a.ism}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {a.jahiz ? a.jayyid : a.sayyi}
            </p>
          </div>
        ))}
      </section>

      <section className="bitaqa p-6">
        <h3 className="mb-1 text-lg font-bold text-white">جاهزية منصّات النشر</h3>
        <p className="mb-4 text-sm text-slate-400">
          كل منصّة تحتاج مفتاحاً مفعّلاً في خزنة المفاتيح ليتمكّن وكلاؤك من النشر عليها.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {KULL_MANASSAT.map((mn) => {
            const khidma = khidmatManassa(mn.ramz);
            const jahiz = khidmatMufaala.has(khidma);
            return (
              <li
                key={mn.ramz}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-layli-900/40 p-3"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: mn.lawn + "22", color: mn.lawn }}
                >
                  <AyqunaManassa ramz={mn.ramz} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{mn.ism}</p>
                  <p className="truncate text-xs text-slate-500">{mn.ismLat}</p>
                </div>
                {jahiz ? (
                  <span className="wasm bg-sada/15 text-sada-soft">
                    <AyqunaSah className="h-3.5 w-3.5" /> جاهزة
                  </span>
                ) : (
                  <Link
                    href="/khazna"
                    className="wasm bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <AyqunaZaid className="h-3.5 w-3.5" /> أضِف مفتاحاً
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bitaqa p-6">
        <h3 className="mb-4 text-lg font-bold text-white">معلومات المنظومة</h3>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Mae label="المستخدم" qima={m.ism} />
          <Mae label="نموذج العقل" qima={namudhaj} ltr />
          <Mae label="الوكلاء" qima={String(adadWukala)} />
          <Mae label="إجمالي المنشورات" qima={String(adadManshurat)} />
        </dl>
      </section>

      <p className="text-center text-xs text-slate-600">
        صَدَى · نسخة تأسيسية — الأمان أولاً، التوسّع بالتصميم.
      </p>
    </div>
  );
}

function HalaNuqta({ jahiz }: { jahiz: boolean }) {
  return jahiz ? (
    <span className="wasm bg-sada/15 text-sada-soft">
      <span className="h-2 w-2 rounded-full bg-sada animate-nabd" /> جاهز
    </span>
  ) : (
    <span className="wasm bg-rose-500/15 text-rose-300">
      <span className="h-2 w-2 rounded-full bg-rose-400" /> غير مهيّأ
    </span>
  );
}

function Mae({ label, qima, ltr }: { label: string; qima: string; ltr?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-layli-900/40 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 font-semibold text-slate-100 ${ltr ? "font-mono text-sm" : ""}`} dir={ltr ? "ltr" : undefined}>
        {qima}
      </dd>
    </div>
  );
}
