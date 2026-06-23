"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { HaykalSatr } from "@/components/Haykal";
import {
  AyqunaManassa,
  AyqunaSah,
  AyqunaIghlaq,
  AyqunaNashr,
  AyqunaBarq,
  AyqunaJadwala,
  AyqunaAql,
} from "@/components/Ayqunat";

interface Halat {
  mawsul: boolean;
  bot?: string;
  qanat?: string;
  ismQanat?: string;
  mushtarikun?: number;
  khattaf?: { mansub: boolean; url?: string; muallaqa?: number };
  khata?: string;
  manshurat?: number;
}

interface WakeelMukhtasar {
  id: string;
  ism: string;
  muzawwid: string;
  namudhaj: string | null;
}

export default function TelegramPage() {
  const [halat, setHalat] = useState<Halat | null>(null);
  const [rabitKhattaf, setRabitKhattaf] = useState("");
  const [wukala, setWukala] = useState<WakeelMukhtasar[]>([]);
  const [wakeelTelegramId, setWakeelTelegramId] = useState<string | null>(null);
  const [tahmil, setTahmil] = useState(true);
  const [jariKhattaf, setJariKhattaf] = useState(false);

  const [matn, setMatn] = useState("");
  const [thabbit, setThabbit] = useState(false);
  const [jariBath, setJariBath] = useState(false);
  const [natija, setNatija] = useState<{ najah: boolean; risala: string } | null>(null);

  const [mawduNashr, setMawduNashr] = useState("");
  const [adadJadwala, setAdadJadwala] = useState(5);
  const [jariNashrTilqai, setJariNashrTilqai] = useState(false);
  const [jariJadwala, setJariJadwala] = useState(false);
  const [jariRabt, setJariRabt] = useState(false);
  const [natijaTilqai, setNatijaTilqai] = useState<{ najah: boolean; risala: string } | null>(null);

  const jalb = useCallback(async () => {
    setTahmil(true);
    try {
      const r = await fetch("/api/telegram/idara");
      const d = await r.json();
      setHalat(d.halat ?? null);
      setRabitKhattaf(d.rabitKhattaf ?? "");
      setWukala(d.wukala ?? []);
      setWakeelTelegramId(d.wakeelTelegramId ?? null);
    } finally {
      setTahmil(false);
    }
  }, []);

  useEffect(() => {
    jalb();
  }, [jalb]);

  async function dabtKhattaf(amal: "webhook-set" | "webhook-delete") {
    setJariKhattaf(true);
    try {
      await fetch("/api/telegram/idara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amal }),
      });
      await jalb();
    } finally {
      setJariKhattaf(false);
    }
  }

  async function ibthIblagh() {
    if (!matn.trim()) return;
    setJariBath(true);
    setNatija(null);
    try {
      const r = await fetch("/api/telegram/idara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amal: "iblagh", matn, thabbit }),
      });
      const d = await r.json();
      setNatija({ najah: Boolean(d.najah), risala: d.risala ?? "" });
      if (d.najah) {
        setMatn("");
        setThabbit(false);
      }
    } catch (e) {
      setNatija({ najah: false, risala: (e as Error).message });
    } finally {
      setJariBath(false);
    }
  }

  const mawsul = halat?.mawsul && !halat?.khata;

  async function rabtWakeel(wakeelId: string | null) {
    setJariRabt(true);
    try {
      await fetch("/api/telegram/idara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amal: "rabt-wakeel", wakeelId }),
      });
      setWakeelTelegramId(wakeelId);
    } finally {
      setJariRabt(false);
    }
  }

  async function nashrFawri() {
    setJariNashrTilqai(true);
    setNatijaTilqai(null);
    try {
      const r = await fetch("/api/telegram/idara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amal: "nashr-tilqai", mawdu: mawduNashr || undefined }),
      });
      const d = await r.json();
      setNatijaTilqai({ najah: Boolean(d.najah), risala: d.risala ?? d.khata ?? "" });
    } catch (e) {
      setNatijaTilqai({ najah: false, risala: (e as Error).message });
    } finally {
      setJariNashrTilqai(false);
    }
  }

  async function jadwalaTilqaiya() {
    setJariJadwala(true);
    setNatijaTilqai(null);
    try {
      const r = await fetch("/api/telegram/idara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amal: "jadwala-tilqaiya", mawdu: mawduNashr || undefined, adad: adadJadwala }),
      });
      const d = await r.json();
      setNatijaTilqai({ najah: Boolean(d.najah), risala: d.risala ?? d.khata ?? "" });
    } catch (e) {
      setNatijaTilqai({ najah: false, risala: (e as Error).message });
    } finally {
      setJariJadwala(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="animate-sariyan">
        <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          <AyqunaManassa ramz="TELEGRAM" className="h-7 w-7 text-[#229ed9]" />
          إدارة قناة تيليغرام
        </h2>
        <p className="mt-1 text-slate-400">
          اربط بوتاً يدير قناتك: انشر، بُثّ الإعلانات، واستقبل الأوامر — كل ذلك من
          صَدَى.
        </p>
      </header>

      {tahmil ? (
        <div className="space-y-3">
          <HaykalSatr />
          <HaykalSatr />
        </div>
      ) : !halat?.mawsul ? (
        <section className="bitaqa animate-sariyan p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#229ed9]/15 text-[#229ed9]">
            <AyqunaManassa ramz="TELEGRAM" className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">لا يوجد بوت مربوط بعد</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            أنشئ بوتاً عبر{" "}
            <span dir="ltr" className="font-mono text-slate-300">
              @BotFather
            </span>
            ، أضِفه مشرفاً في قناتك، ثم خزّن مفتاحه في خزنة المفاتيح بصيغة:
          </p>
          <code
            dir="ltr"
            className="mt-3 inline-block rounded-lg border border-white/10 bg-layli-900/60 px-3 py-1.5 font-mono text-xs text-sada-soft"
          >
            123456789:AA...xyz|@my_channel
          </code>
          <div className="mt-5">
            <Link href="/khazna" className="zir-asasi inline-flex">
              <AyqunaSah className="h-4 w-4" /> أضِف مفتاح تيليغرام
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BitaqaHala
              label="البوت"
              qima={halat.bot ? `@${halat.bot}` : "—"}
              ltr
              jayyid={Boolean(halat.bot)}
            />
            <BitaqaHala
              label="القناة"
              qima={halat.ismQanat ?? halat.qanat ?? "غير محدّدة"}
              jayyid={Boolean(halat.qanat)}
            />
            <BitaqaHala
              label="المشتركون"
              qima={halat.mushtarikun != null ? String(halat.mushtarikun) : "—"}
              jayyid={halat.mushtarikun != null}
            />
            <BitaqaHala
              label="منشورات تيليغرام"
              qima={String(halat.manshurat ?? 0)}
              jayyid
            />
          </section>

          {halat.khata && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
              {halat.khata}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="bitaqa lg:col-span-2 space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">خطّاف الويب</h3>
                <span
                  className={`wasm ${
                    halat.khattaf?.mansub
                      ? "bg-sada/15 text-sada-soft"
                      : "bg-slate-500/15 text-slate-400"
                  }`}
                >
                  {halat.khattaf?.mansub ? "مفعّل" : "معطّل"}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                يُمكّن البوت من استقبال أوامر إدارة القناة فوراً (الحالة، الإحصاء،
                البثّ).
              </p>
              <div className="rounded-xl border border-white/5 bg-layli-900/40 p-3">
                <p className="text-xs text-slate-500">عنوان الخطّاف</p>
                <p dir="ltr" className="mt-1 truncate font-mono text-xs text-slate-300">
                  {rabitKhattaf}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="zir-asasi flex-1"
                  onClick={() => dabtKhattaf("webhook-set")}
                  disabled={jariKhattaf}
                >
                  {jariKhattaf ? "..." : "تفعيل"}
                </button>
                <button
                  className="zir-thanawi flex-1"
                  onClick={() => dabtKhattaf("webhook-delete")}
                  disabled={jariKhattaf || !halat.khattaf?.mansub}
                >
                  تعطيل
                </button>
              </div>
              <p className="text-xs text-slate-600">
                يتطلّب التفعيل عنواناً عامّاً (HTTPS). محلياً استخدم نفقاً مثل
                ngrok وحدّث <span dir="ltr" className="font-mono">NEXT_PUBLIC_APP_URL</span>.
              </p>
            </section>

            <section className="bitaqa lg:col-span-3 space-y-4 p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <AyqunaNashr className="h-5 w-5 text-sada" />
                بثّ إعلان إلى القناة
              </h3>
              <textarea
                className="hakl min-h-32 resize-y"
                placeholder="اكتب نصّ الإعلان الذي سيُنشر مباشرةً في القناة..."
                maxLength={4096}
                value={matn}
                onChange={(e) => {
                  setMatn(e.target.value);
                  setNatija(null);
                }}
              />
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={thabbit}
                    onChange={(e) => setThabbit(e.target.checked)}
                    className="h-4 w-4 accent-sada"
                  />
                  تثبيت في أعلى القناة
                </label>
                <span className="text-xs text-slate-500">{matn.length}/4096</span>
              </div>

              {natija && (
                <div
                  className={`rounded-xl border p-3 text-sm ${
                    natija.najah
                      ? "border-sada/40 bg-sada/10 text-sada-soft"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {natija.risala}
                </div>
              )}

              <button
                className="zir-asasi w-full"
                onClick={ibthIblagh}
                disabled={!matn.trim() || jariBath}
              >
                {jariBath ? "جارٍ البثّ..." : "بثّ الآن"}
              </button>
            </section>
          </div>

          <section className="bitaqa p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <AyqunaAql className="h-5 w-5 text-aql" />
              النشر الذاتي بالذكاء
            </h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">
              اربط وكيلاً يدير القناة تلقائياً — يولّد المحتوى وينشره بذكاء.
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-slate-300">الوكيل المسؤول</label>
              {wukala.length === 0 ? (
                <p className="text-xs text-slate-500">ليس لديك وكيل يستهدف تيليغرام. أنشئ وكيلاً جديداً واختر تيليغرام كمنصّة.</p>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    className="hakl flex-1"
                    value={wakeelTelegramId ?? ""}
                    onChange={(e) => rabtWakeel(e.target.value || null)}
                    disabled={jariRabt}
                  >
                    <option value="" className="bg-layli-800">بلا وكيل</option>
                    {wukala.map((w) => (
                      <option key={w.id} value={w.id} className="bg-layli-800">
                        {w.ism} ({w.muzawwid})
                      </option>
                    ))}
                  </select>
                  {jariRabt && <span className="text-xs text-slate-400">جاري الربط...</span>}
                </div>
              )}
            </div>

            {wakeelTelegramId && (
              <>
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm text-slate-300">موضوع المنشور (اختياري)</label>
                  <input
                    className="hakl"
                    placeholder="مثال: أحدث ابتكارات الذكاء الاصطناعي"
                    value={mawduNashr}
                    onChange={(e) => setMawduNashr(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="zir-asasi"
                    onClick={nashrFawri}
                    disabled={jariNashrTilqai}
                  >
                    {jariNashrTilqai ? "جارٍ النشر..." : <span className="flex items-center gap-2"><AyqunaBarq className="h-4 w-4" /> نشر فوري</span>}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      className="zir-thanawi"
                      onClick={jadwalaTilqaiya}
                      disabled={jariJadwala}
                    >
                      {jariJadwala ? "جارٍ الجدولة..." : <span className="flex items-center gap-2"><AyqunaJadwala className="h-4 w-4" /> جدولة ذكية</span>}
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">عدد:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white text-center"
                        value={adadJadwala}
                        onChange={(e) => setAdadJadwala(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {natijaTilqai && (
                  <div
                    className={`mt-3 rounded-xl border p-3 text-sm ${
                      natijaTilqai.najah
                        ? "border-sada/40 bg-sada/10 text-sada-soft"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {natijaTilqai.risala}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="bitaqa p-6">
            <h3 className="mb-4 text-lg font-bold text-white">أوامر البوت</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { amr: "/halat", wasf: "حالة القناة والاتصال" },
                { amr: "/ihsaiyat", wasf: "إحصاء منشورات تيليغرام" },
                { amr: "/iblagh <نص>", wasf: "بثّ إعلان إلى القناة" },
                { amr: "/help", wasf: "عرض قائمة الأوامر" },
              ].map((a) => (
                <li
                  key={a.amr}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-layli-900/40 p-3"
                >
                  <code
                    dir="ltr"
                    className="rounded-lg bg-[#229ed9]/15 px-2 py-1 font-mono text-xs text-[#229ed9]"
                  >
                    {a.amr}
                  </code>
                  <span className="text-sm text-slate-300">{a.wasf}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-600">
              تعمل الأوامر بعد تفعيل خطّاف الويب. أرسلها للبوت في محادثة خاصّة.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function BitaqaHala({
  label,
  qima,
  jayyid,
  ltr,
}: {
  label: string;
  qima: string;
  jayyid?: boolean;
  ltr?: boolean;
}) {
  return (
    <div className="bitaqa animate-sariyan p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        dir={ltr ? "ltr" : undefined}
        className={`mt-1 truncate font-bold ${
          jayyid ? "text-white" : "text-slate-500"
        } ${ltr ? "font-mono text-sm" : ""}`}
        title={qima}
      >
        {qima}
      </p>
    </div>
  );
}
