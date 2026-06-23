/**
 * واجهة اختبار اتصال مفتاح — تتحقّق من صلاحية المفتاح فوراً قبل الحفظ.
 *
 * POST /api/mafatih/ikhtibar  { khidma, sirr }  → NatijatIkhtibar
 *
 * تحذير: السرّ يُستخدم في الذاكرة لإجراء الاختبار فقط ولا يُخزَّن هنا.
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { jalbNashir } from "@/lib/nashir";
import type { NatijatIkhtibar, RamzKhidma, RamzManassa } from "@/lib/types";

export const runtime = "nodejs";

async function ikhtibarAnthropic(sirr: string): Promise<NatijatIkhtibar> {
  try {
    const amil = new Anthropic({ apiKey: sirr });
    await amil.messages.create({
      model: process.env.SADA_AQL_MODEL ?? "claude-opus-4-8",
      max_tokens: 8,
      messages: [{ role: "user", content: "مرحبا" }],
    });
    return { najah: true, risala: "مفتاح Anthropic صالح ومتّصل." };
  } catch (e) {
    return { najah: false, risala: `فشل: ${(e as Error).message}` };
  }
}

async function ikhtibarOpenAI(sirr: string): Promise<NatijatIkhtibar> {
  try {
    const radd = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${sirr}` },
    });
    if (!radd.ok) return { najah: false, risala: "مفتاح OpenAI غير صالح." };
    return { najah: true, risala: "مفتاح OpenAI صالح ومتّصل." };
  } catch (e) {
    return { najah: false, risala: (e as Error).message };
  }
}

async function ikhtibarOpenRouter(sirr: string): Promise<NatijatIkhtibar> {
  try {
    const radd = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${sirr}` },
    });
    if (!radd.ok) return { najah: false, risala: "مفتاح OpenRouter غير صالح." };
    const data = (await radd.json()) as {
      data?: { label?: string; usage?: number; limit?: number | null };
    };
    const d = data.data;
    const tafsil = d
      ? d.limit != null
        ? ` (المستخدَم ${d.usage ?? 0}$ من ${d.limit}$)`
        : " (رصيد غير محدود)"
      : "";
    return { najah: true, risala: `مفتاح OpenRouter صالح ومتّصل${tafsil}.` };
  } catch (e) {
    return { najah: false, risala: (e as Error).message };
  }
}

// تعيين خدمة المفتاح إلى منصّة نشر للاختبار.
const KHIDMA_ILA_MANASSA: Partial<Record<RamzKhidma, RamzManassa>> = {
  X: "X",
  LINKEDIN: "LINKEDIN",
  META: "INSTAGRAM",
  TIKTOK: "TIKTOK",
  TELEGRAM: "TELEGRAM",
};

export async function POST(req: Request) {
  const { khidma, sirr } = (await req.json()) as {
    khidma?: RamzKhidma;
    sirr?: string;
  };

  if (!khidma || !sirr) {
    return NextResponse.json(
      { najah: false, risala: "الحقول المطلوبة: khidma، sirr." },
      { status: 400 },
    );
  }

  let natija: NatijatIkhtibar;

  if (khidma === "ANTHROPIC") {
    natija = await ikhtibarAnthropic(sirr);
  } else if (khidma === "OPENAI") {
    natija = await ikhtibarOpenAI(sirr);
  } else if (khidma === "OPENROUTER") {
    natija = await ikhtibarOpenRouter(sirr);
  } else {
    const manassa = KHIDMA_ILA_MANASSA[khidma];
    if (!manassa) {
      natija = { najah: false, risala: "خدمة غير مدعومة للاختبار." };
    } else {
      natija = await jalbNashir(manassa).ikhtibar(sirr);
    }
  }

  return NextResponse.json(natija);
}
