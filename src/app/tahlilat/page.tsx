"use client";

/**
 * صفحة التحليلات — رسوم تفاعلية لأداء المنشورات (Recharts).
 */
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MANASSAT, type RamzManassa } from "@/lib/types";
import { Haykal } from "@/components/Haykal";
import { AyqunaTahlilat } from "@/components/Ayqunat";

interface Tahlilat {
  ijmali: { mushahadat: number; i3jabat: number; musharakat: number; ta3liqat: number; manshurat: number };
  hasabManassa: { manassa: string; mushahadat: number; tafa3ul: number; adad: number }[];
  tawziHala: { hala: string; adad: number }[];
  silsila: { maerif: string; wakeel: string; mushahadat: number; i3jabat: number; mu3addal: number }[];
}

const ALWAN_HALA: Record<string, string> = {
  MANSHUR: "#2dd4bf",
  MAJDWAL: "#a78bfa",
  MUSAWWADA: "#64748b",
  QAYD_NASHR: "#fbbf24",
  FASHIL: "#f43f5e",
};
const ISM_HALA: Record<string, string> = {
  MANSHUR: "منشور",
  MAJDWAL: "مجدول",
  MUSAWWADA: "مسوّدة",
  QAYD_NASHR: "قيد النشر",
  FASHIL: "فشل",
};

function raqam(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "ألف" : String(n);
}

export default function TahlilatPage() {
  const [data, setData] = useState<Tahlilat | null>(null);

  useEffect(() => {
    fetch("/api/tahlilat")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <Haykal className="h-8 w-40" />
          <Haykal className="mt-2 h-4 w-64" />
        </header>
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bitaqa space-y-2 p-5">
              <Haykal className="h-7 w-20" />
              <Haykal className="h-4 w-16" />
            </div>
          ))}
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bitaqa p-6">
              <Haykal className="mb-4 h-5 w-40" />
              <Haykal className="h-[260px] w-full rounded-xl" />
            </div>
          ))}
          <div className="bitaqa p-6 lg:col-span-2">
            <Haykal className="mb-4 h-5 w-56" />
            <Haykal className="h-[280px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const kpi = [
    { ism: "المشاهدات", qima: raqam(data.ijmali.mushahadat), lawn: "#60a5fa" },
    { ism: "الإعجابات", qima: raqam(data.ijmali.i3jabat), lawn: "#2dd4bf" },
    { ism: "المشاركات", qima: raqam(data.ijmali.musharakat), lawn: "#a78bfa" },
    { ism: "التعليقات", qima: raqam(data.ijmali.ta3liqat), lawn: "#fbbf24" },
  ];

  const barData = data.hasabManassa.map((h) => ({
    ism: MANASSAT[h.manassa as RamzManassa]?.ism ?? h.manassa,
    مشاهدات: h.mushahadat,
    تفاعل: h.tafa3ul,
    lawn: MANASSAT[h.manassa as RamzManassa]?.lawn ?? "#888",
  }));

  const areaData = data.silsila.map((s) => ({
    ism: s.wakeel.slice(0, 8),
    مشاهدات: s.mushahadat,
    إعجابات: s.i3jabat,
  }));

  const pieData = data.tawziHala.map((t) => ({
    ism: ISM_HALA[t.hala] ?? t.hala,
    qima: t.adad,
    lawn: ALWAN_HALA[t.hala] ?? "#888",
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-sariyan">
        <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          <AyqunaTahlilat className="h-7 w-7 text-sada" /> التحليلات
        </h2>
        <p className="mt-1 text-slate-400">قياس صدى محتواك عبر المنصّات.</p>
      </header>

      {/* مؤشّرات الأداء */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpi.map((k) => (
          <div key={k.ism} className="bitaqa p-5">
            <p className="text-2xl font-extrabold" style={{ color: k.lawn }}>
              {k.qima}
            </p>
            <p className="text-sm text-slate-400">{k.ism}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* الأداء حسب المنصّة */}
        <section className="bitaqa p-6">
          <h3 className="mb-4 text-lg font-bold text-white">الأداء حسب المنصّة</h3>
          {barData.length === 0 ? (
            <Faragh />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="ism" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#10101f",
                    border: "1px solid #ffffff20",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="مشاهدات" radius={[6, 6, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.lawn} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* توزيع الحالات */}
        <section className="bitaqa p-6">
          <h3 className="mb-4 text-lg font-bold text-white">توزيع المنشورات</h3>
          {pieData.length === 0 ? (
            <Faragh />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="qima"
                  nameKey="ism"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.lawn} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#10101f",
                    border: "1px solid #ffffff20",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {pieData.map((d) => (
              <span key={d.ism} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.lawn }} />
                {d.ism} ({d.qima})
              </span>
            ))}
          </div>
        </section>

        {/* منحنى الأداء عبر المنشورات */}
        <section className="bitaqa lg:col-span-2 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">منحنى الأداء عبر آخر المنشورات</h3>
          {areaData.length === 0 ? (
            <Faragh />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradMush" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradI3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="ism" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#10101f",
                    border: "1px solid #ffffff20",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="مشاهدات"
                  stroke="#60a5fa"
                  fill="url(#gradMush)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="إعجابات"
                  stroke="#2dd4bf"
                  fill="url(#gradI3)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  );
}

function Faragh() {
  return (
    <div className="grid h-[260px] place-items-center text-sm text-slate-500">
      لا بيانات كافية بعد — انشر بعض المنشورات لترى صداها هنا.
    </div>
  );
}
