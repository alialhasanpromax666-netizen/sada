"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { KULL_MANASSAT, MUZAWWIDUN, type RamzManassa } from "@/lib/types";
import {
  AyqunaWathiqa,
  AyqunaSah,
  AyqunaManassa,
  AyqunaBarq,
  AyqunaWukala,
  AyqunaTawlid,
  AyqunaIdadat,
  AyqunaJadwala,
} from "@/components/Ayqunat";

const NABARAT = ["ملهمة واثقة", "ودودة حماسية", "رسمية مهنية", "ساخرة خفيفة", "تعليمية هادئة"];
const LUGHAT = ["العربية الفصحى المبسّطة", "العربية العامية الراقية", "ثنائية (عربي/إنجليزي)"];

interface ShaklWakeel {
  id: string;
  ism: string;
  wasf: string;
  takhassus: string;
  shakhsiyya: string;
  manassat: string;
  maarifa: string | null;
  khitaShahri: string | null;
  muzawwid: string;
  namudhaj: string | null;
  hala: string;
  awtomatiki: boolean;
}

interface Shakhsiyya {
  nabra: string;
  uslub: string;
  lugha: string;
  rumuz: boolean;
}

export default function TahrirWakeel() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tahmil, setTahmil] = useState(true);
  const [jari, setJari] = useState(false);
  const [mawjud, setMawjud] = useState(true);
  const [khata, setKhata] = useState("");

  const [ism, setIsm] = useState("");
  const [takhassus, setTakhassus] = useState("");
  const [wasf, setWasf] = useState("");
  const [maarifa, setMaarifa] = useState("");
  const [muzawwid, setMuzawwid] = useState<"OPENROUTER" | "BYNARA">("BYNARA");
  const [namudhaj, setNamudhaj] = useState("");
  const [nabra, setNabra] = useState(NABARAT[0]);
  const [uslub, setUslub] = useState("");
  const [lugha, setLugha] = useState(LUGHAT[0]);
  const [rumuz, setRumuz] = useState(true);
  const [manassat, setManassat] = useState<RamzManassa[]>([]);
  const [awtomatiki, setAwtomatiki] = useState(false);
  const [hala, setHala] = useState<string>("NASHIT");
  const [khitaShahriAdad, setKhitaShahriAdad] = useState(10);
  const [khitaShahriAwqat, setKhitaShahriAwqat] = useState("08:00,12:00,18:00");
  const [khitaShahriAyyam, setKhitaShahriAyyam] = useState("1,2,3,4,5,6,7");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/wukala");
      const d = await r.json();
      const w = (d.wukala ?? []).find((x: { id: string }) => x.id === id);
      if (!w) { setMawjud(false); setTahmil(false); return; }
      const sh: Shakhsiyya = (() => {
        try { return JSON.parse(w.shakhsiyya ?? "{}"); } catch { return {} as Shakhsiyya; }
      })();
      setIsm(w.ism);
      setWasf(w.wasf);
      setTakhassus(w.takhassus);
      setMaarifa(w.maarifa ?? "");
      setMuzawwid(w.muzawwid === "OPENROUTER" ? "OPENROUTER" : "BYNARA");
      setNamudhaj(w.namudhaj ?? "");
      setNabra(NABARAT.includes(sh.nabra) ? sh.nabra : NABARAT[0]);
      setUslub(sh.uslub ?? "");
      setLugha(LUGHAT.includes(sh.lugha) ? sh.lugha : LUGHAT[0]);
      setRumuz(sh.rumuz ?? true);
      setManassat((() => { try { return JSON.parse(w.manassat ?? "[]"); } catch { return []; } })());
      setAwtomatiki(w.awtomatiki ?? false);
      setHala(w.hala ?? "NASHIT");
      const ks: { adad?: number; awqat?: string[]; ayyam?: number[] } = (() => { try { return JSON.parse(w.khitaShahri ?? "{}"); } catch { return {}; } })();
      setKhitaShahriAdad(ks.adad ?? 10);
      setKhitaShahriAwqat(ks.awqat?.join(",") ?? "08:00,12:00,18:00");
      setKhitaShahriAyyam(ks.ayyam?.join(",") ?? "1,2,3,4,5,6,7");
      setTahmil(false);
    })();
  }, [id]);

  function badelManassa(r: RamzManassa) {
    setManassat((cur) =>
      cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r],
    );
  }

  function rafa3Mamarif(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const f of files) {
      if (!f.name.endsWith(".md") && !f.name.endsWith(".txt")) continue;
      const qari = new FileReader();
      qari.onload = () => setMaarifa((cur) => cur + (cur ? "\n\n" : "") + qari.result);
      qari.readAsText(f);
    }
  }

  async function hifz() {
    setJari(true);
    setKhata("");
    try {
      const r = await fetch(`/api/wukala/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ism,
          wasf,
          takhassus,
          maarifa: maarifa || null,
          khitaShahri: JSON.stringify({
            adad: khitaShahriAdad,
            awqat: khitaShahriAwqat.split(",").map((t) => t.trim()).filter(Boolean),
            ayyam: khitaShahriAyyam.split(",").map((d) => Number(d.trim())).filter((n) => n >= 1 && n <= 7),
          }),
          muzawwid,
          namudhaj: namudhaj || null,
          manassat,
          shakhsiyya: { nabra, uslub, lugha, rumuz },
          hala,
          awtomatiki,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        router.push("/wukala");
      } else {
        setKhata(data.khata ?? `فشل الحفظ (HTTP ${r.status})`);
      }
    } finally {
      setJari(false);
    }
  }

  if (tahmil) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bitaqa grid place-items-center py-20 text-slate-500">
          جارٍ التحميل…
        </div>
      </div>
    );
  }

  if (!mawjud) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bitaqa grid place-items-center py-20 text-center">
          <p className="text-slate-400">الوكيل غير موجود.</p>
          <button className="zir-thanawi mt-4" onClick={() => router.push("/wukala")}>
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-sariyan">
        <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          <AyqunaIdadat className="h-7 w-7 text-aql" /> تعديل الوكيل
        </h2>
        <p className="mt-1 text-slate-400">{ism}</p>
      </header>

      <div className="bitaqa space-y-6 p-6">
        {/* الهوية */}
        <fieldset className="space-y-4">
          <legend className="mb-2 text-lg font-bold text-white">الهوية</legend>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">اسم الوكيل</label>
            <input className="hakl" value={ism} onChange={(e) => setIsm(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">مجال التخصّص</label>
            <input className="hakl" value={takhassus} onChange={(e) => setTakhassus(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">وصف المهمّة</label>
            <textarea className="hakl min-h-[90px]" value={wasf} onChange={(e) => setWasf(e.target.value)} />
          </div>
        </fieldset>

        {/* الشخصية */}
        <fieldset className="space-y-4">
          <legend className="mb-2 text-lg font-bold text-white">الشخصية</legend>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">النبرة</label>
            <div className="flex flex-wrap gap-2">
              {NABARAT.map((n) => (
                <button
                  key={n}
                  onClick={() => setNabra(n)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    nabra === n
                      ? "border-aql/60 bg-aql/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">الأسلوب (اختياري)</label>
            <input className="hakl" placeholder="مثال: موجز ومباشر" value={uslub} onChange={(e) => setUslub(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">اللغة</label>
            <select className="hakl" value={lugha} onChange={(e) => setLugha(e.target.value)}>
              {LUGHAT.map((l) => (
                <option key={l} value={l} className="bg-layli-800">{l}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={rumuz} onChange={(e) => setRumuz(e.target.checked)} className="h-5 w-5 accent-sada" />
            <span className="flex items-center gap-2 text-sm text-slate-300"><AyqunaTawlid className="h-4 w-4" /> استخدام الرموز التعبيرية</span>
          </label>
        </fieldset>

        {/* المنصّات */}
        <fieldset className="space-y-3">
          <legend className="mb-2 text-lg font-bold text-white">المنصّات</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {KULL_MANASSAT.map((mn) => {
              const mukhtara = manassat.includes(mn.ramz);
              return (
                <button
                  key={mn.ramz}
                  onClick={() => badelManassa(mn.ramz)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                    mukhtara ? "border-sada/60 bg-sada/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: mn.lawn + "22", color: mn.lawn }}>
                    <AyqunaManassa ramz={mn.ramz} className="h-6 w-6" />
                  </span>
                  <span className="text-sm text-white">{mn.ism}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* معرفة الشركة */}
        <fieldset className="space-y-4">
          <legend className="mb-2 text-lg font-bold text-white">معرفة الشركة (maarifa)</legend>
          <textarea
            className="hakl min-h-[120px]"
            placeholder="الصق محتوى عن الشركة/المنتج (Markdown)..."
            value={maarifa}
            onChange={(e) => setMaarifa(e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-400 hover:border-sada/50 hover:text-sada transition">
            <input type="file" accept=".md,.txt" multiple onChange={rafa3Mamarif} className="hidden" />
            ارفع ملفات .md / .txt
          </label>
        </fieldset>

        {/* المزوّد والنموذج */}
        <fieldset className="space-y-4">
          <legend className="mb-2 text-lg font-bold text-white">مزوّد الذكاء</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">المزوّد</label>
              <select className="hakl" value={muzawwid} onChange={(e) => { setMuzawwid(e.target.value as "OPENROUTER" | "BYNARA"); setNamudhaj(""); }}>
                {(["BYNARA", "OPENROUTER"] as const).map((r) => (
                  <option key={r} value={r} className="bg-layli-800">
                    {MUZAWWIDUN[r].ism} — {MUZAWWIDUN[r].ismLat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">النموذج</label>
              <select className="hakl" value={namudhaj} onChange={(e) => setNamudhaj(e.target.value)}>
                <option value="" className="bg-layli-800">
                  افتراضي ({MUZAWWIDUN[muzawwid].namudhajIftiradi})
                </option>
                {MUZAWWIDUN[muzawwid].namadhijMuqtaraha.map((m) => (
                  <option key={m} value={m} className="bg-layli-800">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* الإعدادات */}
        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-lg font-bold text-white">الإعدادات</legend>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <input type="checkbox" checked={awtomatiki} onChange={(e) => setAwtomatiki(e.target.checked)} className="h-5 w-5 accent-wameed" />
              <span className="flex items-center gap-2 text-sm text-wameed-soft"><AyqunaBarq className="h-4 w-4" /> نشر تلقائي</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm text-slate-300">الحالة:</span>
              <select className="bg-transparent text-sm text-white" value={hala} onChange={(e) => setHala(e.target.value)}>
                <option value="NASHIT" className="bg-layli-800">نشِط</option>
                <option value="NAA_IM" className="bg-layli-800">نائم</option>
                <option value="MUAALLAQ" className="bg-layli-800">معلّق</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* خطة النشر الشهرية */}
        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-lg font-bold text-white">
            <AyqunaJadwala className="h-5 w-5 text-sada" /> خطة النشر الشهرية
          </legend>
          <p className="text-xs text-slate-500">تحدد كمية وتوقيت المنشورات المجدولة تلقائياً كل شهر.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">منشورات/شهر</label>
              <input
                type="number"
                min={1}
                max={200}
                className="hakl"
                value={khitaShahriAdad}
                onChange={(e) => setKhitaShahriAdad(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">أوقات النشر (HH:mm)</label>
              <input
                className="hakl"
                placeholder="08:00,12:00,18:00"
                value={khitaShahriAwqat}
                onChange={(e) => setKhitaShahriAwqat(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">أيام الأسبوع (1-7)</label>
              <input
                className="hakl"
                placeholder="1,2,3,4,5,6,7"
                value={khitaShahriAyyam}
                onChange={(e) => setKhitaShahriAyyam(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* الأزرار */}
      <div className="flex items-center justify-between">
        <button className="zir-thanawi" onClick={() => router.push("/wukala")}>
          إلغاء
        </button>
        <button className="zir-asasi" onClick={hifz} disabled={jari || !ism}>
          {jari ? "جارٍ الحفظ..." : <span className="flex items-center gap-2"><AyqunaSah className="h-4 w-4" /> حفظ التغييرات</span>}
        </button>
      </div>
      {khata && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{khata}</div>}
    </div>
  );
}
