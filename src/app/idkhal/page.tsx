"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AyqunaLawha, AyqunaZaid } from "@/components/Ayqunat";

type Wajh = "dukhal" | "tasjil";

export default function IdkhalPage() {
  const router = useRouter();
  const [wajh, setWajh] = useState<Wajh>("dukhal");
  const [ism, setIsm] = useState("");
  const [email, setEmail] = useState("");
  const [kalimaSirr, setKalimaSirr] = useState("");
  const [khata, setKhata] = useState("");
  const [jari, setJari] = useState(false);

  async function dukhal() {
    setJari(true);
    setKhata("");
    const r = await signIn("credentials", {
      email,
      kalimaSirr,
      redirect: false,
    });
    setJari(false);
    if (r?.error) {
      setKhata("البريد أو كلمة السر غير صحيحة.");
    } else {
      router.push("/");
    }
  }

  async function tasjil() {
    setJari(true);
    setKhata("");
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ism, email, kalimaSirr }),
      });
      const data = await r.json();
      if (!r.ok) {
        setKhata(data.khata ?? "فشل التسجيل.");
        setJari(false);
        return;
      }
      // سجّل الدخول مباشرة بعد التسجيل
      await signIn("credentials", {
        email,
        kalimaSirr,
        redirect: false,
      });
      router.push("/wukala/jadeed");
    } catch {
      setKhata("حدث خطأ في الاتصال.");
      setJari(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-layli-900 px-4">
      <div className="bitaqa w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-sada to-aql text-3xl font-black text-layli-900 shadow-glow">
            ص
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">صَدَى</h1>
          <p className="mt-1 text-sm text-slate-400">منصّة وكلاء النشر الذكي</p>
        </div>

        <div className="mb-6 flex rounded-xl border border-white/10 bg-layli-900/60 p-1">
          <button
            onClick={() => { setWajh("dukhal"); setKhata(""); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              wajh === "dukhal" ? "bg-sada/15 text-sada-soft" : "text-slate-400 hover:text-white"
            }`}
          >
            دخول
          </button>
          <button
            onClick={() => { setWajh("tasjil"); setKhata(""); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              wajh === "tasjil" ? "bg-sada/15 text-sada-soft" : "text-slate-400 hover:text-white"
            }`}
          >
            تسجيل
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            wajh === "dukhal" ? dukhal() : tasjil();
          }}
          className="space-y-4"
        >
          {wajh === "tasjil" && (
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">الاسم</label>
              <input
                className="hakl"
                placeholder="اسمك"
                value={ism}
                onChange={(e) => setIsm(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">البريد الإلكتروني</label>
            <input
              className="hakl"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">كلمة السر</label>
            <input
              className="hakl"
              type="password"
              placeholder="أقل شيء 6 أحرف"
              value={kalimaSirr}
              onChange={(e) => setKalimaSirr(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {khata && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
              {khata}
            </p>
          )}

          <button
            type="submit"
            disabled={jari}
            className="zir-asasi w-full"
          >
            {jari ? "..." : wajh === "dukhal" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>
      </div>
    </div>
  );
}
