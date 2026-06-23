"use client";

/**
 * معالج إنشاء وكيل (Wizard) — أربع خطوات:
 *   ١) الهوية   ٢) الشخصية   ٣) المنصّات   ٤) المراجعة والإطلاق
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KULL_MANASSAT, MUZAWWIDUN, type RamzManassa } from "@/lib/types";
import {
  AyqunaTawlid,
  AyqunaBarq,
  AyqunaManassa,
  AyqunaSah,
  AyqunaJadwala,
} from "@/components/Ayqunat";

const KHUTUWAT = ["الهوية", "الشخصية", "المنصّات", "المراجعة"];

const NABARAT = ["ملهمة واثقة", "ودودة حماسية", "رسمية مهنية", "ساخرة خفيفة", "تعليمية هادئة"];
const LUGHAT = ["العربية الفصحى المبسّطة", "العربية العامية الراقية", "ثنائية (عربي/إنجليزي)"];

export default function JadeedPage() {
  const router = useRouter();
  const [khatwa, setKhatwa] = useState(0);
  const [jari, setJari] = useState(false);
  const [khata, setKhata] = useState("");

  // الحقول
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
  const [khitaShahriAdad, setKhitaShahriAdad] = useState(10);
  const [khitaShahriAwqat, setKhitaShahriAwqat] = useState("08:00,12:00,18:00");
  const [khitaShahriAyyam, setKhitaShahriAyyam] = useState("1,2,3,4,5,6,7");

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

  const yumkinTaqaddum =
    (khatwa === 0 && ism && takhassus) ||
    khatwa === 1 ||
    (khatwa === 2 && manassat.length > 0) ||
    khatwa === 3;

  async function intaj() {
    setJari(true);
    setKhata("");
    try {
      const r = await fetch("/api/wukala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ism,
          wasf,
          takhassus,
          maarifa: maarifa || undefined,
          khitaShahri: JSON.stringify({
            adad: khitaShahriAdad,
            awqat: khitaShahriAwqat.split(",").map((t) => t.trim()).filter(Boolean),
            ayyam: khitaShahriAyyam.split(",").map((d) => Number(d.trim())).filter((n) => n >= 1 && n <= 7),
          }),
          muzawwid,
          namudhaj: namudhaj || undefined,
          manassat,
          awtomatiki,
          shakhsiyya: { nabra, uslub, lugha, rumuz },
        }),
      });
      if (r.ok) router.push("/wukala");
      const data = await r.json().catch(() => ({}));
      setKhata(data.khata ?? `فشل الإنشاء (HTTP ${r.status})`);
    } finally {
      setJari(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-sariyan">
        <h2 className="font-display text-3xl font-extrabold text-white">إنشاء وكيل جديد</h2>
        <p className="mt-1 text-slate-400">امنح صداك شخصيةً ومهمّة.</p>
      </header>

      {/* مؤشّر الخطوات */}
      <div className="flex items-center gap-2">
        {KHUTUWAT.map((k, i) => (
          <div key={k} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                i <= khatwa ? "bg-sada text-layli-900" : "bg-white/5 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i === khatwa ? "text-white" : "text-slate-500"}`}>
              {k}
            </span>
            {i < KHUTUWAT.length - 1 && (
              <div className={`h-px flex-1 ${i < khatwa ? "bg-sada/50" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bitaqa min-h-[320px] p-6">
        {/* الخطوة ١: الهوية */}
        {khatwa === 0 && (
          <div className="animate-sariyan space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">اسم الوكيل</label>
              <input
                className="hakl"
                placeholder="مثال: سفير التقنية"
                value={ism}
                onChange={(e) => setIsm(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">مجال التخصّص</label>
              <input
                className="hakl"
                placeholder="مثال: الذكاء الاصطناعي والبرمجة"
                value={takhassus}
                onChange={(e) => setTakhassus(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">وصف المهمّة</label>
              <textarea
                className="hakl min-h-[90px]"
                placeholder="ماذا ينشر هذا الوكيل ولمن؟"
                value={wasf}
                onChange={(e) => setWasf(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">معرفة الشركة (maarifa)</label>
              <textarea
                className="hakl min-h-[120px]"
                placeholder="الصق محتوى عن الشركة/المنتج (Markdown) أو ارفع ملفات أدناه..."
                value={maarifa}
                onChange={(e) => setMaarifa(e.target.value)}
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-400 hover:border-sada/50 hover:text-sada transition">
                <input
                  type="file"
                  accept=".md,.txt"
                  multiple
                  onChange={rafa3Mamarif}
                  className="hidden"
                />
                ارفع ملفات .md / .txt
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">مزوّد الذكاء</label>
                <select
                  className="hakl"
                  value={muzawwid}
                  onChange={(e) => {
                    setMuzawwid(e.target.value as "OPENROUTER" | "BYNARA");
                    setNamudhaj("");
                  }}
                >
                  {(["BYNARA", "OPENROUTER"] as const).map((r) => (
                    <option key={r} value={r} className="bg-layli-800">
                      {MUZAWWIDUN[r].ism} — {MUZAWWIDUN[r].ismLat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">النموذج</label>
                <select
                  className="hakl"
                  value={namudhaj}
                  onChange={(e) => setNamudhaj(e.target.value)}
                >
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

            <details className="group rounded-xl border border-white/10 bg-white/5">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition">
                <AyqunaJadwala className="h-4 w-4 text-sada" />
                خطة النشر الشهرية
                <span className="mr-auto text-xs text-slate-500">{khitaShahriAdad} منشور/شهر</span>
              </summary>
              <div className="border-t border-white/10 p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm text-slate-300">منشورات/شهر</label>
                    <input type="number" min={1} max={200} className="hakl" value={khitaShahriAdad} onChange={(e) => setKhitaShahriAdad(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-slate-300">أوقات النشر (HH:mm)</label>
                    <input className="hakl" placeholder="08:00,12:00,18:00" value={khitaShahriAwqat} onChange={(e) => setKhitaShahriAwqat(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-slate-300">أيام الأسبوع (1-7)</label>
                    <input className="hakl" placeholder="1,2,3,4,5,6,7" value={khitaShahriAyyam} onChange={(e) => setKhitaShahriAyyam(e.target.value)} />
                  </div>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* الخطوة ٢: الشخصية */}
        {khatwa === 1 && (
          <div className="animate-sariyan space-y-4">
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
              <input
                className="hakl"
                placeholder="مثال: موجز ومباشر مع لمسة فضول"
                value={uslub}
                onChange={(e) => setUslub(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">اللغة</label>
              <select
                className="hakl"
                value={lugha}
                onChange={(e) => setLugha(e.target.value)}
              >
                {LUGHAT.map((l) => (
                  <option key={l} value={l} className="bg-layli-800">
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={rumuz}
                onChange={(e) => setRumuz(e.target.checked)}
                className="h-5 w-5 accent-sada"
              />
              <span className="flex items-center gap-2 text-sm text-slate-300"><AyqunaTawlid className="h-4 w-4" /> استخدام الرموز التعبيرية</span>
            </label>
          </div>
        )}

        {/* الخطوة ٣: المنصّات */}
        {khatwa === 2 && (
          <div className="animate-sariyan space-y-3">
            <p className="text-sm text-slate-400">اختر المنصّات التي سينشر عليها الوكيل:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {KULL_MANASSAT.map((mn) => {
                const mukhtara = manassat.includes(mn.ramz);
                return (
                  <button
                    key={mn.ramz}
                    onClick={() => badelManassa(mn.ramz)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                      mukhtara
                        ? "border-sada/60 bg-sada/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{ background: mn.lawn + "22", color: mn.lawn }}
                    >
                      <AyqunaManassa ramz={mn.ramz} className="h-6 w-6" />
                    </span>
                    <span className="text-sm text-white">{mn.ism}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* الخطوة ٤: المراجعة */}
        {khatwa === 3 && (
          <div className="animate-sariyan space-y-4">
            <div className="rounded-xl border border-white/10 bg-layli-900/40 p-4">
              <h3 className="text-lg font-bold text-white">{ism || "—"}</h3>
              <p className="text-xs text-aql">{takhassus}</p>
              <p className="mt-2 text-sm text-slate-400">{wasf || "بلا وصف"}</p>
              {maarifa && (
                <p className="mt-2 text-xs text-slate-500">معرفة الشركة: {maarifa.slice(0, 80)}…</p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Mufrada label="النبرة" qima={nabra} />
                <Mufrada label="اللغة" qima={lugha} />
                <Mufrada label="الرموز" qima={rumuz ? "مفعّلة" : "معطّلة"} />
                <Mufrada label="المنصّات" qima={`${manassat.length} منصّة`} />
                <Mufrada label="المزوّد" qima={muzawwid} />
                <Mufrada label="النموذج" qima={namudhaj || "افتراضي"} />
                <Mufrada label="خطة شهرية" qima={`${khitaShahriAdad} منشور/شهر`} />
              </dl>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-wameed/30 bg-wameed/5 p-4">
              <input
                type="checkbox"
                checked={awtomatiki}
                onChange={(e) => setAwtomatiki(e.target.checked)}
                className="h-5 w-5 accent-wameed"
              />
              <div>
                <span className="flex items-center gap-2 text-sm font-semibold text-wameed-soft"><AyqunaBarq className="h-4 w-4" /> تفعيل النشر التلقائي</span>
                <p className="text-xs text-slate-400">
                  يولّد الوكيل وينشر تلقائياً في أوقات الذروة (يمكن تعديله لاحقاً).
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* التنقّل */}
      <div className="flex items-center justify-between">
        <button
          className="zir-thanawi"
          onClick={() => setKhatwa((k) => Math.max(0, k - 1))}
          disabled={khatwa === 0}
        >
          السابق
        </button>
        {khatwa < KHUTUWAT.length - 1 ? (
          <button
            className="zir-asasi"
            onClick={() => setKhatwa((k) => k + 1)}
            disabled={!yumkinTaqaddum}
          >
            التالي
          </button>
        ) : (
          <button className="zir-asasi" onClick={intaj} disabled={jari || !ism}>
            {jari ? "جارٍ الإطلاق..." : <span className="flex items-center gap-2"><AyqunaSah className="h-4 w-4" /> إطلاق الوكيل</span>}
          </button>
        )}
      </div>
      {khata && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{khata}</div>}
    </div>
  );
}

function Mufrada({ label, qima }: { label: string; qima: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-200">{qima}</dd>
    </div>
  );
}
