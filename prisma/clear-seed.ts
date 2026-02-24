import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.deleteMany();
  const users = await prisma.user.deleteMany();

  console.log(
    `✅ 시드 데이터 삭제 완료: items ${items.count}개, users ${users.count}개`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
