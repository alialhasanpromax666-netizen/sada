/**
 * مساعد الإشعارات — ينشئ سجلّ إشعار في قاعدة البيانات ويبثّه فورياً
 * عبر ناقل الأحداث (SSE) في خطوة واحدة.
 */
import { db } from "@/lib/db";
import { bathIshaar } from "@/lib/hadath/hadath";
import type { IshaarNaw3 } from "@/lib/types";

export async function ansha2Ishaar(params: {
  mustakhdimId: string;
  naw3: IshaarNaw3;
  unwan: string;
  matn: string;
}) {
  const ishaar = await db.ishaar.create({ data: params });

  // بثّ فوري للواجهة. (naw3 نصّ في قاعدة البيانات — نُحكِم نوعه هنا)
  bathIshaar({
    id: ishaar.id,
    naw3: ishaar.naw3 as IshaarNaw3,
    unwan: ishaar.unwan,
    matn: ishaar.matn,
    waqt: ishaar.createdAt.toISOString(),
  });

  return ishaar;
}
