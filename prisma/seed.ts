import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** User create payload (is_admin, is_super_admin 포함) */
type UserSeedData = Prisma.UserCreateInput & {
  is_admin?: "Y" | "N";
  is_super_admin?: "Y" | "N";
};

async function main() {
  console.log(" 시드 데이터 생성 시작...");

  // 기존 데이터 삭제 (invitation은 user에 cascade)
  await prisma.invitation.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  console.log("기존 데이터 삭제 완료");

  // 테스트 유저 생성
  const marinPassword = await bcrypt.hash("marin@marin.com", 10);
  const defaultPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "marin@marin.com",
        password: marinPassword,
        is_admin: "Y",
        is_super_admin: "Y",
      } as UserSeedData,
    }),
    prisma.user.create({
      data: {
        email: "seller2@codeit.com",
        password: defaultPassword,
        is_admin: "N",
      } as UserSeedData,
    }),
    prisma.user.create({
      data: {
        email: "seller3@codeit.com",
        password: defaultPassword,
        is_admin: "N",
      } as UserSeedData,
    }),
  ]);

  console.log(` ${users.length}명의 유저 생성 완료`);

  // 아이템 샘플 데이터
  const items = [
    // 스낵
    {
      title: "허니버터칩",
      price: 2500,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 150,
      user_id: users[0].id,
    },
    {
      title: "새우깡",
      price: 1500,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 200,
      user_id: users[0].id,
    },
    {
      title: "포카칩 오리지널",
      price: 2000,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 80,
      user_id: users[1].id,
    },
    {
      title: "오감자",
      price: 1800,
      image: "",
      category_main: "스낵",
      category_sub: "과자",
      count: 120,
      user_id: users[0].id,
    },
    {
      title: "초코파이",
      price: 3000,
      image: "",
      category_main: "스낵",
      category_sub: "쿠키·비스킷",
      count: 95,
      user_id: users[1].id,
    },

    // 음료
    {
      title: "코카콜라",
      price: 1200,
      image: "",
      category_main: "음료",
      category_sub: "청량·탄산음료",
      count: 300,
      user_id: users[2].id,
    },
    {
      title: "펩시콜라",
      price: 1200,
      image: "",
      category_main: "음료",
      category_sub: "청량·탄산음료",
      count: 250,
      user_id: users[2].id,
    },
    {
      title: "칠성사이다",
      price: 1000,
      image: "",
      category_main: "음료",
      category_sub: "청량·탄산음료",
      count: 180,
      user_id: users[2].id,
    },
    {
      title: "레드불",
      price: 2500,
      image: "",
      category_main: "음료",
      category_sub: "에너지음료",
      count: 100,
      user_id: users[2].id,
    },
    {
      title: "핫식스",
      price: 1500,
      image: "",
      category_main: "음료",
      category_sub: "에너지음료",
      count: 140,
      user_id: users[2].id,
    },
    {
      title: "칸타타 아메리카노",
      price: 1800,
      image: "",
      category_main: "음료",
      category_sub: "커피음료",
      count: 220,
      user_id: users[2].id,
    },

    // 생수
    {
      title: "제주 삼다수 330ml",
      price: 1000,
      image: "",
      category_main: "생수",
      category_sub: "생수",
      count: 500,
      user_id: users[1].id,
    },
    {
      title: "에비앙 500ml",
      price: 1500,
      image: "",
      category_main: "생수",
      category_sub: "생수",
      count: 150,
      user_id: users[1].id,
    },

    // 간편식
    {
      title: "컵라면 신라면",
      price: 1500,
      image: "",
      category_main: "간편식",
      category_sub: "라면·면류",
      count: 200,
      user_id: users[0].id,
    },
    {
      title: "진라면 매운맛",
      price: 1400,
      image: "",
      category_main: "간편식",
      category_sub: "라면·면류",
      count: 180,
      user_id: users[0].id,
    },
    {
      title: "불닭볶음면",
      price: 1600,
      image: "",
      category_main: "간편식",
      category_sub: "라면·면류",
      count: 160,
      user_id: users[0].id,
    },
  ];

  const createdItems = await Promise.all(
    items.map((item) =>
      prisma.item.create({
        data: item,
      }),
    ),
  );

  console.log(` ${createdItems.length}개의 상품 생성 완료`);

  console.log("\n 생성된 데이터 요약:");
  console.log(`   - 유저: ${users.length}명`);
  console.log(`   - 상품: ${createdItems.length}개`);
  console.log("\n 시드 데이터 생성 완료!");
}

main()
  .catch((e) => {
    console.error(" 시드 데이터 생성 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
