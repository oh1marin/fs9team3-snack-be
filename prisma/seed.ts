import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(' 시드 데이터 생성 시작...');

  // 기존 데이터 삭제
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  console.log('기존 데이터 삭제 완료');

  // 테스트 유저 생성
  const marinPassword = await bcrypt.hash('marin@marin.com', 10);
  const defaultPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'marin@marin.com',
        password: marinPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller2@codeit.com',
        password: defaultPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller3@codeit.com',
        password: defaultPassword,
      },
    }),
  ]);

  console.log(` ${users.length}명의 유저 생성 완료`);

  // 아이템 샘플 데이터
  const items = [
    // 스낵
    {
      title: '허니버터칩',
      price: 2500,
      image: 'https://via.placeholder.com/300x300?text=허니버터칩',
      category_main: '스낵',
      category_sub: '과자',
      count: 150,
      user_id: users[0].id,
    },
    {
      title: '새우깡',
      price: 1500,
      image: 'https://via.placeholder.com/300x300?text=새우깡',
      category_main: '스낵',
      category_sub: '과자',
      count: 200,
      user_id: users[0].id,
    },
    {
      title: '포카칩 오리지널',
      price: 2000,
      image: 'https://via.placeholder.com/300x300?text=포카칩',
      category_main: '스낵',
      category_sub: '과자',
      count: 80,
      user_id: users[1].id,
    },
    {
      title: '오감자',
      price: 1800,
      image: 'https://via.placeholder.com/300x300?text=오감자',
      category_main: '스낵',
      category_sub: '과자',
      count: 120,
      user_id: users[0].id,
    },
    {
      title: '초코파이',
      price: 3000,
      image: 'https://via.placeholder.com/300x300?text=초코파이',
      category_main: '스낵',
      category_sub: '쿠키·비스킷',
      count: 95,
      user_id: users[1].id,
    },

    // 음료
    {
      title: '코카콜라',
      price: 1200,
      image: 'https://via.placeholder.com/300x300?text=코카콜라',
      category_main: '음료',
      category_sub: '청량·탄산음료',
      count: 300,
      user_id: users[2].id,
    },
    {
      title: '펩시콜라',
      price: 1200,
      image: 'https://via.placeholder.com/300x300?text=펩시',
      category_main: '음료',
      category_sub: '청량·탄산음료',
      count: 250,
      user_id: users[2].id,
    },
    {
      title: '칠성사이다',
      price: 1000,
      image: 'https://via.placeholder.com/300x300?text=사이다',
      category_main: '음료',
      category_sub: '청량·탄산음료',
      count: 180,
      user_id: users[2].id,
    },
    {
      title: '레드불',
      price: 2500,
      image: 'https://via.placeholder.com/300x300?text=레드불',
      category_main: '음료',
      category_sub: '에너지음료',
      count: 100,
      user_id: users[2].id,
    },
    {
      title: '핫식스',
      price: 1500,
      image: 'https://via.placeholder.com/300x300?text=핫식스',
      category_main: '음료',
      category_sub: '에너지음료',
      count: 140,
      user_id: users[2].id,
    },
    {
      title: '칸타타 아메리카노',
      price: 1800,
      image: 'https://via.placeholder.com/300x300?text=칸타타',
      category_main: '음료',
      category_sub: '커피음료',
      count: 220,
      user_id: users[2].id,
    },

    // 생수
    {
      title: '제주 삼다수 2L',
      price: 1000,
      image: 'https://via.placeholder.com/300x300?text=삼다수',
      category_main: '생수',
      category_sub: '생수',
      count: 500,
      user_id: users[1].id,
    },
    {
      title: '에비앙 500ml',
      price: 1500,
      image: 'https://via.placeholder.com/300x300?text=에비앙',
      category_main: '생수',
      category_sub: '생수',
      count: 150,
      user_id: users[1].id,
    },

    // 간편식
    {
      title: '컵라면 신라면',
      price: 1500,
      image: 'https://via.placeholder.com/300x300?text=신라면',
      category_main: '간편식',
      category_sub: '라면·면류',
      count: 200,
      user_id: users[0].id,
    },
    {
      title: '진라면 매운맛',
      price: 1400,
      image: 'https://via.placeholder.com/300x300?text=진라면',
      category_main: '간편식',
      category_sub: '라면·면류',
      count: 180,
      user_id: users[0].id,
    },
    {
      title: '불닭볶음면',
      price: 1600,
      image: 'https://via.placeholder.com/300x300?text=불닭볶음면',
      category_main: '간편식',
      category_sub: '라면·면류',
      count: 160,
      user_id: users[0].id,
    },
    {
      title: 'CJ 햇반',
      price: 1800,
      image: 'https://via.placeholder.com/300x300?text=햇반',
      category_main: '간편식',
      category_sub: '즉석밥',
      count: 100,
      user_id: users[0].id,
    },

    // 원두커피
    {
      title: '스타벅스 하우스 블렌드',
      price: 15000,
      image: 'https://via.placeholder.com/300x300?text=스타벅스원두',
      category_main: '원두커피',
      category_sub: '원두커피',
      count: 30,
      user_id: users[2].id,
    },
    {
      title: '카누 다크로스트',
      price: 8000,
      image: 'https://via.placeholder.com/300x300?text=카누',
      category_main: '원두커피',
      category_sub: '원두커피',
      count: 50,
      user_id: users[2].id,
    },

    // 비품
    {
      title: '종이컵 1000개입',
      price: 12000,
      image: 'https://via.placeholder.com/300x300?text=종이컵',
      category_main: '비품',
      category_sub: '일회용품',
      count: 40,
      user_id: users[1].id,
    },
    {
      title: '키친타월 6롤',
      price: 8000,
      image: 'https://via.placeholder.com/300x300?text=키친타월',
      category_main: '비품',
      category_sub: '주방용품',
      count: 60,
      user_id: users[1].id,
    },
  ];

  const createdItems = await Promise.all(
    items.map((item) =>
      prisma.item.create({
        data: item,
      })
    )
  );

  console.log(` ${createdItems.length}개의 상품 생성 완료`);

  console.log('\n 생성된 데이터 요약:');
  console.log(`   - 유저: ${users.length}명`);
  console.log(`   - 상품: ${createdItems.length}개`);
  console.log('\n 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error(' 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
