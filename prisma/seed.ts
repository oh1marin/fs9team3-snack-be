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
      image: 'https://www.highwayclub.co.kr/Data/Upload/Custom/8801019606557_s.jpg',
      category_main: '스낵',
      category_sub: '과자',
      count: 150,
      user_id: users[0].id,
    },
    {
      title: '새우깡',
      price: 1500,
      image: 'https://img3.yna.co.kr/etc/inner/KR/2014/10/28/AKR20141028049100030_01_i_P4.jpg',
      category_main: '스낵',
      category_sub: '과자',
      count: 200,
      user_id: users[0].id,
    },
    {
      title: '포카칩 오리지널',
      price: 2000,
      image: 'https://lottemartzetta.com/images-v3/932dcbc7-fca8-4d43-bcde-f73d1ce3cc7d/33573e22-1ea4-4939-92d7-4e82d04b9862/960x960.jpg',
      category_main: '스낵',
      category_sub: '과자',
      count: 80,
      user_id: users[1].id,
    },
    {
      title: '오감자',
      price: 1800,
      image: 'https://i.namu.wiki/i/B9_3N7_zvYPvc18IkMJ5xo2X4tB-Qim46kIiRrZ5Y7eqHWwCLvPkCJPLNz8MMMGno6mMJQpFV7HhCLNELHLRKw.webp',
      category_main: '스낵',
      category_sub: '과자',
      count: 120,
      user_id: users[0].id,
    },
    {
      title: '초코파이',
      price: 3000,
      image: 'https://contents.lotteon.com/itemimage/20260203070708/LM/88/01/11/75/34/91/2_/00/1/LM8801117534912_001_1.jpg',
      category_main: '스낵',
      category_sub: '쿠키·비스킷',
      count: 95,
      user_id: users[1].id,
    },

    // 음료
    {
      title: '코카콜라',
      price: 1200,
      image: 'https://img.danawa.com/prod_img/500000/869/939/img/10939869_1.jpg?_v=20200616103745',
      category_main: '음료',
      category_sub: '청량·탄산음료',
      count: 300,
      user_id: users[2].id,
    },
    {
      title: '펩시콜라',
      price: 1200,
      image: 'https://lottechilsung.cdn-nhncommerce.com/Mall-No-K7JL/migration/79723/product/19413274/21933_N_N_M.jpg',
      category_main: '음료',
      category_sub: '청량·탄산음료',
      count: 250,
      user_id: users[2].id,
    },
    {
      title: '칠성사이다',
      price: 1000,
      image: 'https://contents.kyobobook.co.kr/sih/fit-in/375x0/gift/pdt/1236/S1737438816923.jpg',
      category_main: '음료',
      category_sub: '청량·탄산음료',
      count: 180,
      user_id: users[2].id,
    },
    {
      title: '레드불',
      price: 2500,
      image: 'https://img.dongwonmall.com/dwmall/static_root/product_img/main/0036209/003620917_1_a.jpg?f=webp&q=80',
      category_main: '음료',
      category_sub: '에너지음료',
      count: 100,
      user_id: users[2].id,
    },
    {
      title: '핫식스',
      price: 1500,
      image: 'https://img.danawa.com/prod_img/500000/231/686/img/1686231_1.jpg?_v=20251105070043',
      category_main: '음료',
      category_sub: '에너지음료',
      count: 140,
      user_id: users[2].id,
    },
    {
      title: '칸타타 아메리카노',
      price: 1800,
      image: 'https://company.lottechilsung.co.kr/common/images/product_view0105_bh1.jpg',
      category_main: '음료',
      category_sub: '커피음료',
      count: 220,
      user_id: users[2].id,
    },

    // 생수
    {
      title: '제주 삼다수 330ml',
      price: 1000,
      image: 'https://img.danawa.com/prod_img/500000/821/745/img/11745821_1.jpg?_v=20251125064123',
      category_main: '생수',
      category_sub: '생수',
      count: 500,
      user_id: users[1].id,
    },
    {
      title: '에비앙 500ml',
      price: 1500,
      image: 'https://img.danawa.com/prod_img/500000/404/654/img/1654404_1.jpg?_v=20251114061803',
      category_main: '생수',
      category_sub: '생수',
      count: 150,
      user_id: users[1].id,
    },

    // 간편식
    {
      title: '컵라면 신라면',
      price: 1500,
      image: 'https://www.costco.co.kr/medias/sys_master/images/h77/h5f/139386647674910.jpg',
      category_main: '간편식',
      category_sub: '라면·면류',
      count: 200,
      user_id: users[0].id,
    },
    {
      title: '진라면 매운맛',
      price: 1400,
      image: 'https://www.costco.co.kr/medias/sys_master/images/h16/h00/17480497725470.jpg',
      category_main: '간편식',
      category_sub: '라면·면류',
      count: 180,
      user_id: users[0].id,
    },
    {
      title: '불닭볶음면',
      price: 1600,
      image: 'https://i.namu.wiki/i/8QIkCOxYp_Vc1sfS4CGlFqt9O4Wh-Zqaj_p4uaCFDfm_6C8y_uJ4NBibDOSxUSgC8vAQ-2REZRpxPjoC9xOO3g.webp',
      category_main: '간편식',
      category_sub: '라면·면류',
      count: 160,
      user_id: users[0].id,
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
