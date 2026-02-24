import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("유저를 제외한 데이터 삭제 시작...");

  const orderItems = await prisma.orderItem.deleteMany();
  const carts = await prisma.cart.deleteMany();
  const orders = await prisma.order.deleteMany();
  const items = await prisma.item.deleteMany();
  const invitations = await prisma.invitation.deleteMany();
  const initialBudgets = await prisma.initialBudget.deleteMany();
  const monthlyBudgets = await prisma.monthlyBudget.deleteMany();

  console.log("유저를 제외한 데이터 삭제 완료:");
  console.log(`  - OrderItem: ${orderItems.count}개`);
  console.log(`  - Cart: ${carts.count}개`);
  console.log(`  - Order: ${orders.count}개`);
  console.log(`  - Item: ${items.count}개`);
  console.log(`  - Invitation: ${invitations.count}개`);
  console.log(`  - InitialBudget: ${initialBudgets.count}개`);
  console.log(`  - MonthlyBudget: ${monthlyBudgets.count}개`);
}

main()
  .catch((e) => {
    console.error("삭제 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
