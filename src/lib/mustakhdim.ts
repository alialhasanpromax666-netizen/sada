import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function jalbMustakhdimHali() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("غير مصادق");
  }
  const m = await db.mustakhdim.findUnique({
    where: { email: session.user.email },
  });
  if (!m) {
    throw new Error("المستخدم غير موجود");
  }
  return m;
}

export async function jalbMustakhdimAmin() {
  try {
    return await jalbMustakhdimHali();
  } catch {
    return null;
  }
}
