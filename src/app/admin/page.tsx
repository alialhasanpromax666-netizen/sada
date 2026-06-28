/**
 * لوحة الأدمين — إحصائيات عامة للمستخدمين والمنشورات.
 *
 * /admin
 */
"use client";

import { useEffect, useState } from "react";

interface Ihsaiyyat {
  adadMustakhdimin: number;
  adadWukala: number;
  adadManshurat: number;
  adadManashir: number;
  adadFashila: number;
  mustakhdimun: {
    id: string;
    ism: string;
    email: string;
    dawr: string;
    createdAt: string;
    adadWukala: number;
    adadManshurat: number;
  }[];
}

export default function SafhatAdmin() {
  const [ihsaiyyat, setIhsaiyyat] = useState<Ihsaiyyat | null>(null);
  const [khata, setKhata] = useState("");
  const [jari, setJari] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ihsaiyyat")
      .then((r) => r.json())
      .then((d) => {
        if (d.khata) setKhata(d.khata);
        else setIhsaiyyat(d);
      })
      .catch((e) => setKhata(e.message))
      .finally(() => setJari(false));
  }, []);

  if (jari) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sada border-t-transparent" />
      </div>
    );
  }

  if (khata) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-300">
        {khata}
      </div>
    );
  }

  if (!ihsaiyyat) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-white">لوحة الأدمين</h1>
        <p className="text-sm text-slate-400">إحصائيات المنصة والمستخدمين</p>
      </header>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartIhsaaiy unwan="المستخدمين" adad={ihsaiyyat.adadMustakhdimin} lawn="from-sada to-aql" />
        <KartIhsaaiy unwan="الوكلاء" adad={ihsaiyyat.adadWukala} lawn="from-wameed to-amber-600" />
        <KartIhsaaiy unwan="المنشورات" adad={ihsaiyyat.adadManshurat} lawn="from-emerald-500 to-teal-600" />
        <KartIhsaaiy unwan="المنشورة" adad={ihsaiyyat.adadManashir} lawn="from-sada to-emerald-500" />
      </div>

      {/* جدول المستخدمين */}
      <section className="bitaqa p-6">
        <h3 className="mb-4 text-lg font-bold text-white">المستخدمون ({ihsaiyyat.adadMustakhdimin})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/10 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">الوكلاء</th>
                <th className="px-4 py-3">المنشورات</th>
                <th className="px-4 py-3">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ihsaiyyat.mustakhdimun.map((m) => (
                <tr key={m.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{m.ism}</td>
                  <td className="px-4 py-3 text-slate-400">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${
                      m.dawr === "ADIM" 
                        ? "bg-wameed/20 text-wameed-soft" 
                        : "bg-slate-500/20 text-slate-300"
                    }`}>
                      {m.dawr === "ADIM" ? "أدمين" : "مستخدم"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{m.adadWukala}</td>
                  <td className="px-4 py-3 text-slate-300">{m.adadManshurat}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString("ar")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KartIhsaaiy({ unwan, adad, lawn }: { unwan: string; adad: number; lawn: string }) {
  return (
    <div className="bitaqa p-4">
      <p className="text-xs text-slate-400">{unwan}</p>
      <p className={`mt-1 bg-gradient-to-r ${lawn} bg-clip-text text-3xl font-extrabold text-transparent`}>
        {adad.toLocaleString("ar")}
      </p>
    </div>
  );
}
