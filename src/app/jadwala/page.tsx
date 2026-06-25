"use client";

/**
 * صفحة الجدولة والنشر — قلب التشغيل اليومي:
 *   ١) اختيار وكيل + منصّة + موضوع ← توليد منشورات بالعقل
 *   ٢) معاينة، ثم نشر فوري أو جدولة في أفضل وقت ذروة
 *   ٣) متابعة المنشورات المجدولة والمسوّدات والنشر منها
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MANASSAT, type RamzManassa } from "@/lib/types";
import { afdalMawid, jawdatMawid } from "@/lib/mujadwil/mujadwil";
import {
  AyqunaJadwala,
  AyqunaTawlid,
  AyqunaNashr,
  AyqunaBarq,
  AyqunaManassa,
} from "@/components/Ayqunat";

interface WakeelMin {
  id: string;
  ism: string;
  manassat: string;
}
interface ManshurAard {
  id: string;
  manassa: string;
  matn: string;
  hala: string;
  mawiidNashr: string | null;
  wakeel: { ism: string };
  wasait?: string | null;
}
interface TahrirManshur {
  id: string;
  matn: string;
  mawiidNashr: string;
}

function JadwalaContent() {
  const params = useSearchParams();
  const [wukala, setWukala] = useState<WakeelMin[]>([]);
  const [wakeelId, setWakeelId] = useState("");
  const [manassa, setManassa] = useState<RamzManassa | "">("");
  const [mawdu, setMawdu] = useState("");
  const [adad, setAdad] = useState(3);

  const [muwallada, setMuwallada] = useState<string[]>([]);
  const [jariTawlid, setJariTawlid] = useState(false);
  const [khata, setKhata] = useState("");

  const [manshurat, setManshurat] = useState<ManshurAard[]>([]);
  const [mustahaqq, setMustahaqq] = useState(0); // منشورات حان موعدها
  const [jariTanfidh, setJariTanfidh] = useState(false);

  // تعديل المنشور
  const [tahrir, setTahrir] = useState<TahrirManshur | null>(null);
  const [matnTahrir, setMatnTahrir] = useState("");
  const [mawidTahrir, setMawidTahrir] = useState("");
  const [jariHifz, setJariHifz] = useState(false);

  // الصور
  const [suwarMuwallada, setSuwarMuwallada] = useState<Record<number, string>>({});
  const [jariSuwar, setJariSuwar] = useState<Record<number, boolean>>({});

  // جلب الوكلاء
  useEffect(() => {
    fetch("/api/wukala")
      .then((r) => r.json())
      .then((d) => {
        setWukala(d.wukala ?? []);
        const mns = params.get("wakeel");
        if (mns && d.wukala?.some((w: WakeelMin) => w.id === mns)) setWakeelId(mns);
      });
  }, [params]);

  // جلب المنشورات + عدّ المستحقّ للنشر الآن
  async function jalbManshurat() {
    const [rm, rt] = await Promise.all([
      fetch("/api/manshurat"),
      fetch("/api/mujadwil/tanfidh"),
    ]);
    const dm = await rm.json();
    const dt = await rt.json();
    setManshurat(dm.manshurat ?? []);
    setMustahaqq(dt.mustahaqqa ?? 0);
  }
  useEffect(() => {
    jalbManshurat();
  }, []);

  // تنفيذ كل المنشورات المجدولة التي حان موعدها (محاكاة المُشغّل الخلفي).
  async function naffidhMustahaqq() {
    setJariTanfidh(true);
    try {
      await fetch("/api/mujadwil/tanfidh", { method: "POST" });
      await jalbManshurat();
    } finally {
      setJariTanfidh(false);
    }
  }

  const wakeel = wukala.find((w) => w.id === wakeelId);
  const manassatWakeel: RamzManassa[] = useMemo(
    () => (wakeel ? (JSON.parse(wakeel.manassat) as RamzManassa[]) : []),
    [wakeel],
  );

  // ضبط المنصّة الافتراضية عند تغيّر الوكيل
  useEffect(() => {
    if (manassatWakeel.length && !manassatWakeel.includes(manassa as RamzManassa)) {
      setManassa(manassatWakeel[0]);
    }
  }, [manassatWakeel, manassa]);

  async function tawlid() {
    if (!wakeelId || !manassa) return;
    setJariTawlid(true);
    setKhata("");
    setMuwallada([]);
    try {
      const r = await fetch("/api/manshurat/tawlid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wakeelId, manassa, mawdu, adad }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.khata ?? "فشل التوليد");
      setMuwallada(d.manshurat ?? []);
    } catch (e) {
      setKhata((e as Error).message);
    } finally {
      setJariTawlid(false);
    }
  }

  // إنشاء منشور ثم (اختياري) نشره فوراً
  async function hifzAwNashr(matn: string, fawri: boolean) {
    if (!wakeelId || !manassa) return;
    const mawiid = fawri ? null : afdalMawid(manassa as RamzManassa).toISOString();
    const r = await fetch("/api/manshurat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wakeelId, manassa, matn, mawiidNashr: mawiid }),
    });
    const d = await r.json();
    if (fawri && d.manshur?.id) {
      const rn = await fetch(`/api/manshurat/${d.manshur.id}/nashr`, { method: "POST" });
      const dn = await rn.json();
      if (!dn.najah) {
        setKhata(dn.khata ?? "فشل النشر");
      }
    }
    setMuwallada((cur) => cur.filter((x) => x !== matn));
    jalbManshurat();
  }

  async function nashrMawjud(id: string) {
    const r = await fetch(`/api/manshurat/${id}/nashr`, { method: "POST" });
    const d = await r.json();
    if (!d.najah) {
      setKhata(d.khata ?? "فشل النشر");
    } else {
      setKhata("");
    }
    jalbManshurat();
  }

  // فتح نافذة التعديل
  function iftahTahrir(p: ManshurAard) {
    setTahrir({ id: p.id, matn: p.matn, mawiidNashr: p.mawiidNashr ?? "" });
    setMatnTahrir(p.matn);
    setMawidTahrir(p.mawiidNashr ? new Date(p.mawiidNashr).toISOString().slice(0, 16) : "");
  }

  // حفظ التعديلات
  async function hifzTahrir() {
    if (!tahrir) return;
    setJariHifz(true);
    try {
      await fetch(`/api/manshurat/${tahrir.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matn: matnTahrir,
          mawiidNashr: mawidTahrir ? new Date(mawidTahrir).toISOString() : null,
        }),
      });
      setTahrir(null);
      jalbManshurat();
    } finally {
      setJariHifz(false);
    }
  }

  // حذف منشور
  async function huthfManshur(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
    await fetch(`/api/manshurat/${id}`, { method: "DELETE" });
    setTahrir(null);
    jalbManshurat();
  }

  // توليد صورة للمنشور
  async function tawlidSuora(matn: string, faHirIndex: number) {
    setJariSuwar((cur) => ({ ...cur, [faHirIndex]: true }));
    try {
      const r = await fetch("/api/suwar/tahdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mawdu: matn.slice(0, 100),
          kalimatMiftahiyah: [matn.split("\n")[0].slice(0, 50)],
        }),
      });
      const d = await r.json();
      if (d.suwar?.[0]?.rabit) {
        setSuwarMuwallada((cur) => ({ ...cur, [faHirIndex]: d.suwar[0].rabit }));
      }
    } finally {
      setJariSuwar((cur) => ({ ...cur, [faHirIndex]: false }));
    }
  }

  const hadAqsa = manassa ? MANASSAT[manassa as RamzManassa].hadAqsa : 280;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="animate-sariyan">
        <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white"><AyqunaJadwala className="h-7 w-7 text-sada" /> الجدولة والنشر</h2>
        <p className="mt-1 text-slate-400">ولّد محتوى وكلائك، ثم انشره فوراً أو في أفضل وقت ذروة.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* لوحة التوليد */}
        <section className="bitaqa lg:col-span-2 space-y-4 p-6">
          <h3 className="text-lg font-bold text-white">مولّد المحتوى</h3>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">الوكيل</label>
            <select
              className="hakl"
              value={wakeelId}
              onChange={(e) => setWakeelId(e.target.value)}
            >
              <option value="" className="bg-layli-800">
                — اختر وكيلاً —
              </option>
              {wukala.map((w) => (
                <option key={w.id} value={w.id} className="bg-layli-800">
                  {w.ism}
                </option>
              ))}
            </select>
          </div>

          {manassatWakeel.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">المنصّة</label>
              <div className="flex flex-wrap gap-2">
                {manassatWakeel.map((mn) => (
                  <button
                    key={mn}
                    onClick={() => setManassa(mn)}
                    className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                      manassa === mn
                        ? "border-sada/60 bg-sada/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                    style={manassa === mn ? { color: MANASSAT[mn].lawn } : {}}
                  >
                    <AyqunaManassa ramz={mn} className="h-4 w-4" /> {MANASSAT[mn].ism}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">الموضوع / الفكرة</label>
            <textarea
              className="hakl min-h-[80px]"
              placeholder="مثال: أهمية التعلّم المستمر (اتركه فارغاً ليختار الوكيل بنفسه)"
              value={mawdu}
              onChange={(e) => setMawdu(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">عدد المنشورات: {adad}</label>
            <input
              type="range"
              min={1}
              max={6}
              value={adad}
              onChange={(e) => setAdad(Number(e.target.value))}
              className="w-full accent-sada"
            />
          </div>

          <button
            className="zir-asasi w-full"
            onClick={tawlid}
            disabled={!wakeelId || !manassa || jariTawlid}
          >
            {jariTawlid ? "العقل يفكّر..." : "توليد بالعقل"}
          </button>

          {khata && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              {khata}
            </p>
          )}
        </section>

        {/* المخرجات المولّدة */}
        <section className="lg:col-span-3 space-y-3">
          {muwallada.length === 0 ? (
            <div className="bitaqa grid h-full place-items-center p-10 text-center text-sm text-slate-500">
              {jariTawlid ? "جارٍ التوليد…" : "ستظهر المنشورات المولّدة هنا للمعاينة والنشر."}
            </div>
          ) : (
            muwallada.map((matn, i) => {
              const tul = matn.length;
              const tajawuz = tul > hadAqsa;
              const suraHalihiya = suwarMuwallada[i];
              const jariSura = jariSuwar[i];
              return (
                <div key={i} className="bitaqa animate-sariyan p-4">
                  {suraHalihiya && (
                    <img
                      src={suraHalihiya}
                      alt="صورة المنشور"
                      className="mb-3 w-full rounded-xl object-cover"
                      style={{ maxHeight: 300 }}
                    />
                  )}
                  <p className="whitespace-pre-wrap text-sm text-slate-200">{matn}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className={`text-xs ${tajawuz ? "text-rose-400" : "text-slate-500"}`}>
                      {tul}/{hadAqsa} حرف
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="zir-thanawi px-3 py-1.5 text-xs"
                        onClick={() => tawlidSuora(matn, i)}
                        disabled={jariSura}
                      >
                        {jariSura ? "جارٍ التوليد..." : "توليد صورة"}
                      </button>
                      <button
                        className="zir-thanawi px-3 py-1.5 text-xs"
                        onClick={() => hifzAwNashr(matn, false)}
                      >
                        <AyqunaJadwala className="h-4 w-4" /> جدولة ذكية
                      </button>
                      <button
                        className="zir-asasi px-3 py-1.5 text-xs"
                        onClick={() => hifzAwNashr(matn, true)}
                      >
                        <AyqunaNashr className="h-4 w-4" /> نشر الآن
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* المنشورات المجدولة والمسوّدات */}
      <section className="bitaqa p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">طابور المنشورات</h3>
          {mustahaqq > 0 && (
            <button
              className="zir-asasi px-3 py-1.5 text-xs"
              onClick={naffidhMustahaqq}
              disabled={jariTanfidh}
              title="ينشر كل منشور مجدول حان موعده"
            >
              {jariTanfidh
                ? "جارٍ النشر…"
                : <span className="flex items-center gap-2"><AyqunaBarq className="h-4 w-4" /> نشر المستحقّ الآن ({mustahaqq})</span>}
            </button>
          )}
        </div>
        {manshurat.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">لا منشورات في الطابور بعد.</p>
        ) : (
          <ul className="space-y-3">
            {manshurat.map((p) => {
              const mn = p.manassa as RamzManassa;
              const mawid = p.mawiidNashr ? new Date(p.mawiidNashr) : null;
              const jawda = mawid ? jawdatMawid(mn, mawid) : null;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-layli-900/40 p-3"
                >
                  {p.wasait && (
                    <img
                      src={p.wasait}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ background: MANASSAT[mn].lawn + "22", color: MANASSAT[mn].lawn }}
                  >
                    <AyqunaManassa ramz={mn} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{p.matn}</p>
                    <p className="text-xs text-slate-500">
                      {p.wakeel.ism}
                      {mawid && ` • ${mawid.toLocaleString("ar")} `}
                      {jawda !== null && (
                        <span className="text-sada"> • جودة الوقت {jawda}%</span>
                      )}
                    </p>
                  </div>
                  <HalaWasm hala={p.hala} />
                  {(p.hala === "MUSAWWADA" || p.hala === "MAJDWAL" || p.hala === "FASHIL") && (
                    <div className="flex gap-2">
                      <button
                        className="zir-thanawi px-3 py-1.5 text-xs"
                        onClick={() => iftahTahrir(p)}
                      >
                        تعديل
                      </button>
                      <button
                        className="zir-asasi px-3 py-1.5 text-xs"
                        onClick={() => nashrMawjud(p.id)}
                      >
                        نشر
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* نافذة التعديل */}
      {tahrir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bitaqa w-full max-w-lg space-y-4 p-6">
            <h3 className="text-lg font-bold text-white">تعديل المنشور</h3>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">النص</label>
              <textarea
                className="hakl min-h-[120px]"
                value={matnTahrir}
                onChange={(e) => setMatnTahrir(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">موعد النشر (اتركه فارغاً للنشر الفوري)</label>
              <input
                type="datetime-local"
                className="hakl"
                value={mawidTahrir}
                onChange={(e) => setMawidTahrir(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/20 transition"
                onClick={() => huthfManshur(tahrir.id)}
              >
                حذف المنشور
              </button>
              <div className="flex gap-3">
                <button className="zir-thanawi" onClick={() => setTahrir(null)}>
                  إلغاء
                </button>
                <button className="zir-asasi" onClick={hifzTahrir} disabled={jariHifz}>
                  {jariHifz ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HalaWasm({ hala }: { hala: string }) {
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

export default function JadwalaPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-500">جارٍ التحميل…</p>}>
      <JadwalaContent />
    </Suspense>
  );
}
