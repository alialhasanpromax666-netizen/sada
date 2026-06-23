"use client";

/**
 * صفحة الوكلاء — عرض وإدارة الوكلاء الذكيين.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { MANASSAT, type RamzManassa } from "@/lib/types";
import { HaykalBitaqa } from "@/components/Haykal";
import {
  AyqunaWukala,
  AyqunaManassa,
  AyqunaBarq,
  AyqunaHadhf,
  AyqunaZaid,
  AyqunaIdadat,
} from "@/components/Ayqunat";

interface WakeelAard {
  id: string;
  ism: string;
  wasf: string;
  takhassus: string;
  manassat: string;
  hala: "NASHIT" | "NAA_IM" | "MUAALLAQ";
  awtomatiki: boolean;
  _count: { manshurat: number };
}

const HALAT: Record<WakeelAard["hala"], { ism: string; cls: string }> = {
  NASHIT: { ism: "نشِط", cls: "bg-sada/15 text-sada-soft" },
  NAA_IM: { ism: "نائم", cls: "bg-slate-500/15 text-slate-400" },
  MUAALLAQ: { ism: "معلّق", cls: "bg-wameed/15 text-wameed-soft" },
};

export default function WukalaPage() {
  const [wukala, setWukala] = useState<WakeelAard[]>([]);
  const [tahmil, setTahmil] = useState(true);

  async function jalb() {
    const r = await fetch("/api/wukala");
    const d = await r.json();
    setWukala(d.wukala ?? []);
    setTahmil(false);
  }
  useEffect(() => {
    jalb();
  }, []);

  async function badelHala(id: string, hala: WakeelAard["hala"]) {
    const jadida = hala === "NASHIT" ? "NAA_IM" : "NASHIT";
    await fetch(`/api/wukala/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hala: jadida }),
    });
    jalb();
  }

  async function hadhf(id: string) {
    await fetch(`/api/wukala/${id}`, { method: "DELETE" });
    jalb();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-end justify-between animate-sariyan">
        <div>
          <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white">
            <AyqunaWukala className="h-7 w-7 text-aql" /> الوكلاء
          </h2>
          <p className="mt-1 text-slate-400">
            كل وكيل شخصية مستقلّة تنشر بصوتها الخاص. أنشئ، فعّل، وأطلِق صداك.
          </p>
        </div>
        <Link href="/wukala/jadeed" className="zir-asasi">
          <AyqunaZaid className="h-4 w-4" /> وكيل جديد
        </Link>
      </header>

      {tahmil ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <HaykalBitaqa key={i} />
          ))}
        </div>
      ) : wukala.length === 0 ? (
        <div className="bitaqa grid place-items-center gap-3 py-16 text-center">
          <AyqunaWukala className="h-12 w-12 text-slate-600" />
          <p className="max-w-sm text-slate-400">
            لم تنشئ وكلاء بعد. ابدأ بمعالج الإنشاء خطوة بخطوة.
          </p>
          <Link href="/wukala/jadeed" className="zir-asasi">
            إنشاء أول وكيل
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wukala.map((w) => {
            const manassat = JSON.parse(w.manassat) as RamzManassa[];
            const h = HALAT[w.hala];
            return (
              <div key={w.id} className="bitaqa animate-sariyan flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-aql to-aql-deep text-white shadow-glow-aql">
                    <AyqunaWukala className="h-6 w-6" />
                  </div>
                  <span className={`wasm ${h.cls}`}>{h.ism}</span>
                </div>

                <h3 className="text-lg font-bold text-white">{w.ism}</h3>
                <p className="text-xs text-aql">{w.takhassus}</p>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-400">{w.wasf}</p>

                <div className="my-3 flex items-center gap-1.5">
                  {manassat.map((mn) => (
                    <span
                      key={mn}
                      className="grid h-7 w-7 place-items-center rounded-lg"
                      style={{ background: MANASSAT[mn].lawn + "22", color: MANASSAT[mn].lawn }}
                      title={MANASSAT[mn].ism}
                    >
                      <AyqunaManassa ramz={mn} className="h-4 w-4" />
                    </span>
                  ))}
                  {w.awtomatiki && (
                    <span className="wasm bg-wameed/15 text-wameed-soft mr-auto">
                      <AyqunaBarq className="h-3.5 w-3.5" /> تلقائي
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-500">
                    {w._count.manshurat} منشور
                  </span>
                  <div className="flex gap-1">
                    <Link
                      href={`/jadwala?wakeel=${w.id}`}
                      className="rounded-lg px-2.5 py-1 text-xs text-sada transition hover:bg-sada/10"
                    >
                      توليد ونشر
                    </Link>
                    <Link
                      href={`/wukala/${w.id}`}
                      className="rounded-lg px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                    >
                      <AyqunaIdadat className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => badelHala(w.id, w.hala)}
                      className="rounded-lg px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                    >
                      {w.hala === "NASHIT" ? "إيقاف" : "تفعيل"}
                    </button>
                    <button
                      onClick={() => hadhf(w.id)}
                      className="grid place-items-center rounded-lg px-2 py-1 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                      title="حذف"
                    >
                      <AyqunaHadhf className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
