import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("상품 시드 데이터 리셋 시작...");

  // 기존 상품만 삭제 (Cart, OrderItem은 cascade로 함께 삭제)
  const deleted = await prisma.item.deleteMany();
  console.log(`기존 상품 ${deleted.count}개 삭제 완료`);

  // 유저 조회 (상품에 user_id 매핑용)
  const users = await prisma.user.findMany({ orderBy: { create_at: "asc" } });
  if (users.length === 0) {
    throw new Error("유저가 없습니다. 먼저 prisma:seed를 실행해 주세요.");
  }

  const [u0, u1, u2] = [users[0], users[1], users[2] ?? users[0]];

  const items = [
    // 스낵
    {
      title: "허니버터칩",
      price: 2500,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 150,
      user_id: u0.id,
    },
    {
      title: "새우깡",
      price: 1500,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 200,
      user_id: u0.id,
    },
    {
      title: "포카칩 오리지널",
      price: 2000,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 80,
      user_id: u1.id,
    },
    {
      title: "오감자",
      price: 1800,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 120,
      user_id: u0.id,
    },
    {
      title: "초코파이",
      price: 3000,
      image: "",
      category_main: "스낵",
      category_sub: "쿠키·비스킷",
      count: 95,
      user_id: u1.id,
    },
    // 음료
    {
      title: "코카콜라",
      price: 1200,
      image: "",
      category_main: "음료",
      category_sub: "청량·탄산음료",
      count: 300,
      user_id: u2.id,
    },
    {
      title: "펩시콜라",
      price: 1200,
      image: "",
      category_main: "음료",
      category_sub: "청량·탄산음료",
      count: 250,
      user_id: u2.id,
    },
    {
      title: "칠성사이다",
      price: 1000,
      image: "",
      category_main: "음료",
      category_sub: "청량·탄산음료",
      count: 180,
      user_id: u2.id,
    },
    {
      title: "레드불",
      price: 2500,
      image: "",
      category_main: "음료",
      category_sub: "에너지음료",
      count: 100,
      user_id: u2.id,
    },
    {
      title: "핫식스",
      price: 1500,
      image: "",
      category_main: "음료",
      category_sub: "에너지음료",
      count: 140,
      user_id: u2.id,
    },
    {
      title: "칸타타 아메리카노",
      price: 1800,
      image: "",
      category_main: "음료",
      category_sub: "커피음료",
      count: 220,
      user_id: u2.id,
    },
    // 생수
    {
      title: "제주 삼다수 330ml",
      price: 1000,
      image: "",
      category_main: "생수",
      category_sub: "생수",
      count: 500,
      user_id: u1.id,
    },
    {
      title: "에비앙 500ml",
      price: 1500,
      image: "",
      category_main: "생수",
      category_sub: "생수",
      count: 150,
      user_id: u1.id,
    },
    // 간편식
    {
      title: "컵라면 신라면",
      price: 1500,
      image: "",
      category_main: "간편식",
      category_sub: "라면·면류",
      count: 200,
      user_id: u0.id,
    },
    {
      title: "진라면 매운맛",
      price: 1400,
      image: "",
      category_main: "간편식",
      category_sub: "라면·면류",
      count: 180,
      user_id: u0.id,
    },
    {
      title: "불닭볶음면",
      price: 1600,
      image: "",
      category_main: "간편식",
      category_sub: "라면·면류",
      count: 160,
      user_id: u0.id,
    },
  ];

  const createdItems = await Promise.all(
    items.map((item) => prisma.item.create({ data: item })),
  );

  console.log(`상품 ${createdItems.length}개 생성 완료`);
  console.log("상품 시드 완료!");
}

main()
  .catch((e) => {
    console.error("상품 시드 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
