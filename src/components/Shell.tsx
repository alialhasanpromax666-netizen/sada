"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  AyqunaLawha,
  AyqunaWukala,
  AyqunaKhazna,
  AyqunaJadwala,
  AyqunaTahlilat,
  AyqunaIdadat,
  AyqunaJaras,
  AyqunaManassa,
  AyqunaIghlaq,
  AyqunaQaima,
} from "@/components/Ayqunat";

interface IshaarHayy {
  id: string;
  naw3: "MA3LUMA" | "NAJAH" | "TAHDHIR" | "KHATA";
  unwan: string;
  matn: string;
  waqt: string;
}

const RAWABIT: { href: string; ism: string; Ayquna: (p: { className?: string }) => ReactNode }[] = [
  { href: "/", ism: "لوحة التحكم", Ayquna: AyqunaLawha },
  { href: "/wukala", ism: "الوكلاء", Ayquna: AyqunaWukala },
  { href: "/khazna", ism: "خزنة المفاتيح", Ayquna: AyqunaKhazna },
  { href: "/jadwala", ism: "الجدولة", Ayquna: AyqunaJadwala },
  { href: "/telegram", ism: "قناة تيليغرام", Ayquna: (p) => <AyqunaManassa ramz="TELEGRAM" {...p} /> },
  { href: "/tahlilat", ism: "التحليلات", Ayquna: AyqunaTahlilat },
  { href: "/idadat", ism: "الإعدادات", Ayquna: AyqunaIdadat },
];

const RAWABIT_ADMIN: { href: string; ism: string; Ayquna: (p: { className?: string }) => ReactNode }[] = [
  { href: "/admin", ism: "لوحة الأدمين", Ayquna: AyqunaLawha },
];

const LAWN_NAW3: Record<IshaarHayy["naw3"], string> = {
  NAJAH: "border-sada/40 bg-sada/10 text-sada-soft",
  KHATA: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  TAHDHIR: "border-wameed/40 bg-wameed/10 text-wameed-soft",
  MA3LUMA: "border-aql/40 bg-aql/10 text-aql",
};

function TanaqulRawabit({ masar, dawr }: { masar: string; dawr?: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {RAWABIT.map((r) => {
        const nashit = masar === r.href;
        return (
          <Link
            key={r.href}
            href={r.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              nashit
                ? "bg-sada/15 text-sada-soft shadow-glow"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <r.Ayquna className="h-5 w-5 shrink-0" />
            {r.ism}
          </Link>
        );
      })}
      {dawr === "ADIM" && RAWABIT_ADMIN.map((r) => {
        const nashit = masar === r.href;
        return (
          <Link
            key={r.href}
            href={r.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              nashit
                ? "bg-wameed/15 text-wameed-soft shadow-glow"
                : "text-wameed hover:bg-wameed/10 hover:text-wameed-soft"
            }`}
          >
            <r.Ayquna className="h-5 w-5 shrink-0" />
            {r.ism}
          </Link>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const masar = usePathname();
  const { data: session, status } = useSession();
  const [toasts, setToasts] = useState<IshaarHayy[]>([]);
  const [ghayrMaqru, setGhayrMaqru] = useState(0);
  const [hayy, setHayy] = useState(false);
  const [qaimaMaftuha, setQaimaMaftuha] = useState(false);
  const [dawr, setDawr] = useState<string>("MUSTAKHDIM");

  const izalaToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // hooks قبل أي return شرطي — يضمن استقرار الترتيب
  useEffect(() => {
    setQaimaMaftuha(false);
  }, [masar]);

  useEffect(() => {
    fetch("/api/mustakhdim/dawr")
      .then((r) => r.json())
      .then((d) => setDawr(d.dawr ?? "MUSTAKHDIM"))
      .catch(() => setDawr("MUSTAKHDIM"));
  }, []);

  useEffect(() => {
    fetch("/api/isharat")
      .then((r) => r.json())
      .then((d) => setGhayrMaqru(d.ghayrMaqru ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const masdar = new EventSource("/api/isharat/bath");
    masdar.onopen = () => setHayy(true);
    masdar.onerror = () => setHayy(false);
    masdar.onmessage = (e) => {
      try {
        const ishaar = JSON.parse(e.data) as IshaarHayy;
        if (!ishaar.id) return;
        setToasts((t) => [ishaar, ...t].slice(0, 4));
        setGhayrMaqru((n) => n + 1);
        setTimeout(() => izalaToast(ishaar.id), 6000);
      } catch {
        /* نبضة/تعليق — تجاهل */
      }
    };
    return () => masdar.close();
  }, [izalaToast]);

  // صفحة الدخول: اعرض المحتوى بدون هيكل
  if (masar === "/idkhal") {
    return <>{children}</>;
  }

  // بينما تتحقق المصادقة، اعرض شاشة تحميل بسيطة أو المحتوى
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-layli-900">
        <div className="h-8 w-8 animate-nabd rounded-full bg-sada" />
      </div>
    );
  }

  // غير مصادق: وجّه إلى الدخول
  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.href = "/idkhal";
    }
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* الشريط الجانبي */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-white/10 bg-layli-800/50 p-5 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sada to-aql text-2xl font-black text-layli-900 shadow-glow">
            ص
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-white">صَدَى</h1>
            <p className="text-[11px] text-slate-400">صوتك يتردّد في كل مكان</p>
          </div>
        </div>

        <TanaqulRawabit masar={masar} dawr={dawr} />

        <div className="mt-auto space-y-2">
          {/* رابط تيليغرام */}
          <a
            href="https://t.me/blueprint_cha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-sada/30 bg-sada/10 px-3 py-2.5 text-sm font-medium text-sada-soft transition hover:bg-sada/20"
          >
            <AyqunaManassa ramz="TELEGRAM" className="h-5 w-5 shrink-0" />
            تابعنا على تيليغرام
          </a>
          {/* اسم المستخدم */}
          <div className="rounded-xl border border-white/10 bg-layli-900/60 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${hayy ? "bg-sada animate-nabd" : "bg-slate-600"}`}
              />
              {hayy ? "البثّ الحيّ متّصل" : "غير متّصل"}
            </div>
            {session?.user?.name && (
              <p className="mt-2 text-slate-500">{session.user.name}</p>
            )}
          </div>

          {/* زرّ الخروج */}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <AyqunaIghlaq className="h-4 w-4" />
            خروج
          </button>
        </div>
      </aside>

      {/* ستار التنقّل للجوّال */}
      {qaimaMaftuha && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setQaimaMaftuha(false)}
            aria-label="إغلاق القائمة"
          />
          <div className="absolute inset-y-0 right-0 flex w-72 animate-inzilaq flex-col border-l border-white/10 bg-layli-800/95 p-5 backdrop-blur-xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sada to-aql text-2xl font-black text-layli-900 shadow-glow">
                  ص
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold text-white">صَدَى</h1>
                  <p className="text-[11px] text-slate-400">صوتك يتردّد في كل مكان</p>
                </div>
              </div>
              <button
                onClick={() => setQaimaMaftuha(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="إغلاق"
              >
                <AyqunaIghlaq className="h-5 w-5" />
              </button>
            </div>

            <TanaqulRawabit masar={masar} dawr={dawr} />

            <div className="mt-auto space-y-2">
              {/* رابط تيليغرام */}
              <a
                href="https://t.me/blueprint_cha"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-sada/30 bg-sada/10 px-3 py-2.5 text-sm font-medium text-sada-soft transition hover:bg-sada/20"
              >
                <AyqunaManassa ramz="TELEGRAM" className="h-5 w-5 shrink-0" />
                تابعنا على تيليغرام
              </a>
              <div className="rounded-xl border border-white/10 bg-layli-900/60 p-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${hayy ? "bg-sada animate-nabd" : "bg-slate-600"}`}
                  />
                  {hayy ? "البثّ الحيّ متّصل" : "غير متّصل"}
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
              >
                <AyqunaIghlaq className="h-4 w-4" />
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-layli-900/70 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setQaimaMaftuha(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
              title="القائمة"
              aria-label="فتح القائمة"
            >
              <AyqunaQaima className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-extrabold text-white">صَدَى</h1>
          </div>
          <div className="hidden text-sm text-slate-400 md:block">
            منظومة وكلاء النشر الذكي
          </div>

          <button
            onClick={() => {
              fetch("/api/isharat", { method: "PATCH" }).then(() =>
                setGhayrMaqru(0),
              );
            }}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            title="الإشعارات"
          >
            <AyqunaJaras className="h-5 w-5" />
            {ghayrMaqru > 0 && (
              <span className="absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-wameed px-1 text-[10px] font-bold text-layli-900">
                {ghayrMaqru > 9 ? "9+" : ghayrMaqru}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* الرسائل المنبثقة الفورية */}
      <div className="fixed bottom-6 left-6 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-sariyan rounded-xl border p-3 backdrop-blur-xl ${LAWN_NAW3[t.naw3]}`}
            onClick={() => izalaToast(t.id)}
            role="button"
          >
            <p className="text-sm font-bold">{t.unwan}</p>
            <p className="mt-0.5 text-xs opacity-90">{t.matn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
