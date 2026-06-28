import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const user = await db.mustakhdim.findFirst({
    where: { email: "alialhasanpromax666@gmail.com" },
  });
  if (user) {
    await db.mustakhdim.update({
      where: { id: user.id },
      data: { dawr: "ADIM" },
    });
    console.log("تم تحديث المستخدم إلى ADIM:", user.email);
  } else {
    console.log("لم يتم العثور على المستخدم — إنشاء حساب جديد...");
    await db.mustakhdim.create({
      data: {
        email: "alialhasanpromax666@gmail.com",
        ism: "صصص",
        dawr: "ADIM",
      },
    });
    console.log("تم إنشاء حساب أدمين جديد");
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
