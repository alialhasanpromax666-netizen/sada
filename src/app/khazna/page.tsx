"use client";

/**
 * خزنة المفاتيح (Key Vault) — إدارة آمنة لمفاتيح API.
 *   - الأسرار تُشفّر على الخادم (AES-256-GCM) قبل التخزين.
 *   - اختبار اتصال فوري قبل الحفظ.
 *   - عرض مُقنّع (آخر 4 أحرف فقط)، تفعيل/تعطيل، حذف.
 */

import { useEffect, useState } from "react";
import { KULL_KHIDMAT, type RamzKhidma } from "@/lib/types";
import { HaykalSatr } from "@/components/Haykal";
import {
  AyqunaKhazna,
  AyqunaSah,
  AyqunaIghlaq,
  AyqunaHadhf,
} from "@/components/Ayqunat";

interface MiftahAard {
  id: string;
  manassa: string;
  laqab: string;
  basma: string;
  fa3aal: boolean;
  marratIstikhdam: number;
  akhirIstikhdam: string | null;
}

export default function KhaznaPage() {
  const [mafatih, setMafatih] = useState<MiftahAard[]>([]);
  const [tahmil, setTahmil] = useState(true);

  // نموذج الإضافة
  const [khidma, setKhidma] = useState<RamzKhidma>("ANTHROPIC");
  const [laqab, setLaqab] = useState("");
  const [sirr, setSirr] = useState("");
  const [ikhtibar, setIkhtibar] = useState<{ najah: boolean; risala: string } | null>(null);
  const [jariIkhtibar, setJariIkhtibar] = useState(false);
  const [jariHifz, setJariHifz] = useState(false);

  // اكتشاف قنوات تيليغرام
  const [jariKashf, setJariKashf] = useState(false);
  const [qanawatMuktshafa, setQanawatMuktshafa] = useState<{ id: string; ism: string }[]>([]);
  const [qanatMukhtar, setQanatMukhtar] = useState("");

  async function jalb() {
    setTahmil(true);
    const r = await fetch("/api/mafatih");
    const d = await r.json();
    setMafatih(d.mafatih ?? []);
    setTahmil(false);
  }

  useEffect(() => {
    jalb();
  }, []);

  async function ikhtibarIttisal() {
    setJariIkhtibar(true);
    setIkhtibar(null);
    try {
      const r = await fetch("/api/mafatih/ikhtibar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ khidma, sirr }),
      });
      const d = await r.json();
      setIkhtibar({ najah: d.najah, risala: d.risala ?? "" });
    } catch (e) {
      setIkhtibar({ najah: false, risala: (e as Error).message });
    } finally {
      setJariIkhtibar(false);
    }
  }

  async function hifz() {
    if (!laqab || !sirr) return;
    setJariHifz(true);
    try {
      const r = await fetch("/api/mafatih", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manassa: khidma, laqab, sirr }),
      });
      if (r.ok) {
        setLaqab("");
        setSirr("");
        setIkhtibar(null);
        await jalb();
      }
    } finally {
      setJariHifz(false);
    }
  }

  async function kashfQanawat() {
    if (!sirr.trim()) return;
    setJariKashf(true);
    setQanawatMuktshafa([]);
    setQanatMukhtar("");
    try {
      const r = await fetch("/api/telegram/kashf-qanawat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sirr.split("|")[0].trim() }),
      });
      const d = await r.json();
      if (d.najah && d.qanawat?.length) {
        setQanawatMuktshafa(d.qanawat);
      } else {
        setIkhtibar({ najah: false, risala: d.khata ?? "لم يُعثر على قنوات. أضِف البوت مشرفاً للقناة أولاً." });
      }
    } catch {
      setIkhtibar({ najah: false, risala: "فشل الاتصال بخادم تيليغرام." });
    } finally {
      setJariKashf(false);
    }
  }

  function tatbiqQanat() {
    if (!qanatMukhtar) return;
    const token = sirr.split("|")[0].trim();
    setSirr(`${token}|${qanatMukhtar}`);
    setQanawatMuktshafa([]);
    setQanatMukhtar("");
  }

  async function badelHala(id: string, fa3aal: boolean) {
    await fetch(`/api/mafatih/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fa3aal }),
    });
    jalb();
  }

  async function hadhf(id: string) {
    await fetch(`/api/mafatih/${id}`, { method: "DELETE" });
    jalb();
  }

  const wasfKhidma = KULL_KHIDMAT.find((k) => k.ramz === khidma)!;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="animate-sariyan">
        <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          <AyqunaKhazna className="h-7 w-7 text-sada" /> خزنة المفاتيح
        </h2>
        <p className="mt-1 text-slate-400">
          مفاتيحك مشفّرة بمعيار <span className="text-sada">AES-256-GCM</span>. لا تُخزَّن القيمة
          الخام أبداً، ولا تُعرض كاملة بعد الحفظ.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* نموذج الإضافة */}
        <section className="bitaqa lg:col-span-2 space-y-4 p-6">
          <h3 className="text-lg font-bold text-white">إضافة مفتاح جديد</h3>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">الخدمة</label>
            <div className="grid grid-cols-2 gap-2">
              {KULL_KHIDMAT.map((k) => (
                <button
                  key={k.ramz}
                  onClick={() => {
                    setKhidma(k.ramz);
                    setIkhtibar(null);
                    setQanawatMuktshafa([]);
                  }}
                  className={`rounded-xl border p-2.5 text-right text-sm transition ${
                    khidma === k.ramz
                      ? "border-sada/60 bg-sada/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span className="block font-semibold" style={{ color: k.lawn }}>
                    {k.ism}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{wasfKhidma.tawdih}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">لقب المفتاح</label>
            <input
              className="hakl"
              placeholder="مثال: حساب الشركة الرئيسي"
              value={laqab}
              onChange={(e) => setLaqab(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">السرّ (المفتاح)</label>
            <input
              className="hakl font-mono"
              type="password"
              placeholder={khidma === "TELEGRAM" ? "123456789:AA...xyz" : "sk-..."}
              value={sirr}
              onChange={(e) => {
                setSirr(e.target.value);
                setIkhtibar(null);
                setQanawatMuktshafa([]);
              }}
            />
            {khidma === "TELEGRAM" && (
              <div className="mt-1.5 space-y-2">
                <p className="text-xs text-slate-500">
                  أدخل رمز البوت فقط، ثم اضغط "اكتشاف القنوات" لاختيار القناة تلقائياً.
                </p>
                <button
                  className="zir-thanawi w-full text-xs"
                  onClick={kashfQanawat}
                  disabled={!sirr.trim() || jariKashf}
                >
                  {jariKashf ? "جارٍ الاكتشاف..." : "اكتشاف القنوات تلقائياً"}
                </button>

                {qanawatMuktshafa.length > 0 && (
                  <div className="rounded-xl border border-sada/20 bg-sada/5 p-3 space-y-2">
                    <p className="text-xs text-sada-soft">قنوات تم اكتشافها:</p>
                    {qanawatMuktshafa.map((q) => (
                      <label
                        key={q.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                      >
                        <input
                          type="radio"
                          name="qanat"
                          value={q.id}
                          checked={qanatMukhtar === q.id}
                          onChange={() => setQanatMukhtar(q.id)}
                          className="h-4 w-4 accent-sada"
                        />
                        <span className="text-white">{q.ism}</span>
                        <code className="mr-auto font-mono text-xs text-slate-500">{q.id}</code>
                      </label>
                    ))}
                    <button
                      className="zir-asasi w-full text-xs"
                      onClick={tatbiqQanat}
                      disabled={!qanatMukhtar}
                    >
                      تطبيق القناة المختارة
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {ikhtibar && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                ikhtibar.najah
                  ? "border-sada/40 bg-sada/10 text-sada-soft"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-300"
              }`}
            >
              {ikhtibar.najah ? (
                <AyqunaSah className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AyqunaIghlaq className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{ikhtibar.risala}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="zir-thanawi flex-1"
              onClick={ikhtibarIttisal}
              disabled={!sirr || jariIkhtibar}
            >
              {jariIkhtibar ? "جارٍ الاختبار…" : "اختبار الاتصال"}
            </button>
            <button
              className="zir-asasi flex-1"
              onClick={hifz}
              disabled={!laqab || !sirr || jariHifz}
            >
              {jariHifz ? "جارٍ الحفظ…" : "حفظ مشفّراً"}
            </button>
          </div>
        </section>

        {/* قائمة المفاتيح */}
        <section className="bitaqa lg:col-span-3 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">
            المفاتيح المخزّنة ({mafatih.length})
          </h3>

          {tahmil ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <HaykalSatr key={i} />
              ))}
            </div>
          ) : mafatih.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              لا مفاتيح بعد. أضِف أول مفتاح من النموذج المجاور.
            </p>
          ) : (
            <ul className="space-y-3">
              {mafatih.map((mk) => {
                const k = KULL_KHIDMAT.find((x) => x.ramz === mk.manassa);
                return (
                  <li
                    key={mk.id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-layli-900/40 p-3"
                  >
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold"
                      style={{ background: (k?.lawn ?? "#888") + "22", color: k?.lawn ?? "#888" }}
                    >
                      {(k?.ism ?? mk.manassa).slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{mk.laqab}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {k?.ism ?? mk.manassa} • ••••{mk.basma} • استُخدم {mk.marratIstikhdam} مرّة
                      </p>
                    </div>
                    <button
                      onClick={() => badelHala(mk.id, !mk.fa3aal)}
                      className={`wasm ${
                        mk.fa3aal
                          ? "bg-sada/15 text-sada-soft"
                          : "bg-slate-500/15 text-slate-400"
                      }`}
                      title="تفعيل/تعطيل"
                    >
                      {mk.fa3aal ? "مفعّل" : "معطّل"}
                    </button>
                    <button
                      onClick={() => hadhf(mk.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                      title="حذف"
                    >
                      <AyqunaHadhf className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
