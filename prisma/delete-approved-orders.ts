import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

/** 구매 내역(승인된 주문)만 삭제. order_items는 Order 삭제 시 cascade로 함께 삭제됨. */
async function main() {
  const result = await prisma.order.deleteMany({
    where: { status: OrderStatus.approved },
  });
  console.log(`✅ 구매 내역(승인된 주문) 삭제 완료: ${result.count}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
