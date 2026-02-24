/**
 * Swagger JSDoc 주석 모음. swagger-jsdoc가 이 파일을 스캔하여 OpenAPI 스펙을 생성합니다.
 * ※ API 경로는 수정하지 마세요.
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: 회원가입
 *     description: 이메일·비밀번호로 회원가입. 성공 시 accessToken, refreshToken 쿠키 설정 및 user·tokens JSON 반환. FE는 credentials 'include'로 호출.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "user@example.com", description: "가입용 이메일" }
 *               password: { type: string, minLength: 8, example: "password123", description: "비밀번호 (8자 이상)" }
 *               invitationToken: { type: string, description: "초대 링크 토큰 (선택)" }
 *     responses:
 *       201:
 *         description: 회원가입 성공. accessToken, refreshToken 쿠키 설정 및 JSON 반환
 *       400:
 *         description: 이메일/비밀번호 누락, 형식 오류, 비밀번호 8자 미만
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *       409:
 *         description: 이미 사용 중인 이메일
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 로그인
 *     description: 이메일·비밀번호로 로그인. 성공 시 accessToken, refreshToken 쿠키 설정. FE는 credentials 'include' 필수.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "user@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: 로그인 성공. accessToken, refreshToken 쿠키 설정 및 user, tokens 반환
 *       401:
 *         description: 이메일 또는 비밀번호 오류
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 현재 유저 정보 (쿠키 기반 인증)
 *     description: 쿠키의 accessToken으로 로그인된 사용자 정보 조회. FE 헤더/리다이렉트 판단용.
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: 로그인된 사용자 정보 (id, email, nickname 등)
 *       401:
 *         description: 인증되지 않음 (쿠키 없음 또는 만료)
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: 로그아웃 (쿠키 삭제)
 *     description: accessToken, refreshToken 쿠키 삭제.
 *     responses:
 *       200:
 *         description: 로그아웃 완료
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: 토큰 갱신 (refreshToken으로 액세스+리프레시 재발급)
 *     description: refreshToken(쿠키 또는 body)으로 accessToken·refreshToken 둘 다 새로 발급(회전). 액세스 10분, 리프레시 24시간.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, description: "쿠키 대신 body로 전달 가능" }
 *     responses:
 *       200:
 *         description: accessToken, refreshToken 갱신, 쿠키 재설정, JSON으로 둘 다 반환
 *       401:
 *         description: refreshToken 만료 또는 없음
 */

/**
 * @swagger
 * /api/auth/password:
 *   patch:
 *     tags: [Auth]
 *     summary: 비밀번호 변경 (쿠키 기반 인증)
 *     description: 로그인된 사용자의 비밀번호를 새 비밀번호로 변경. FE 프로필 페이지에서 사용. body는 새 비밀번호만 전달.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, minLength: 8, example: "newPassword123", description: "새 비밀번호 (8자 이상)" }
 *     responses:
 *       200:
 *         description: 비밀번호 변경 완료
 *       400:
 *         description: 비밀번호 누락 또는 8자 미만
 *       401:
 *         description: 인증되지 않음
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     tags: [Items]
 *     summary: 상품 목록 조회 (페이지네이션)
 *     description: 카테고리·정렬·페이지로 상품 목록 조회. FE 상품 목록 페이지에서 사용.
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category_main
 *         schema: { type: string, example: "음료" }
 *         description: 대분류 (예 음료)
 *       - in: query
 *         name: category_sub
 *         schema: { type: string, example: "청량·탄산음료" }
 *         description: 소분류
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [최신순, 판매순, 낮은가격순, 높은가격순], default: "최신순" }
 *         description: 정렬 기준
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *         description: 페이지당 개수
 *       - in: query
 *         name: mine
 *         schema: { type: string, enum: ["1"] }
 *         description: "1이면 본인 등록 상품만 (로그인 필요)"
 *     responses:
 *       200:
 *         description: data, pagination. data[].count=구매 횟수(주문 승인 시 증가)
 *       401:
 *         description: 인증되지 않음
 *   post:
 *     tags: [Items]
 *     summary: 상품 등록
 *     description: 로그인된 사용자가 새 상품 등록. 이미지는 base64 또는 URL.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, image, category_main, category_sub]
 *             properties:
 *               title: { type: string, example: "오리온 포카칩" }
 *               price: { type: integer, example: 1500 }
 *               image: { type: string, description: "이미지 base64 또는 URL" }
 *               category_main: { type: string, example: "과자" }
 *               category_sub: { type: string, example: "스낵" }
 *               link: { type: string, nullable: true, description: "상품 링크 (선택)" }
 *     responses:
 *       201:
 *         description: 상품 생성 완료
 *       400:
 *         description: 필수 필드 누락 등
 *       401:
 *         description: 인증되지 않음
 */

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     tags: [Items]
 *     summary: 상품 상세 조회
 *     description: 상품 ID로 상세 정보 조회 (판매자 정보 포함). FE 상품 상세/모달에서 사용.
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 상품 ID
 *     responses:
 *       200:
 *         description: 상품 상세 (판매자 정보 포함)
 *       400:
 *         description: 유효하지 않은 id
 *       404:
 *         description: 상품 없음
 *       401:
 *         description: 인증되지 않음
 *   patch:
 *     tags: [Items]
 *     summary: 상품 수정 (PATCH)
 *     description: 본인 상품만 수정 가능. 일부 필드만 보내도 됨.
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               price: { type: integer }
 *               image: { type: string }
 *               category_main: { type: string }
 *               category_sub: { type: string }
 *               link: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: 수정 완료
 *       400:
 *         description: 유효하지 않은 id 또는 body
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 본인 상품 아님
 *       404:
 *         description: 상품 없음
 *   put:
 *     tags: [Items]
 *     summary: 상품 수정 (PUT, PATCH와 동일)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               price: { type: integer }
 *               image: { type: string }
 *               category_main: { type: string }
 *               category_sub: { type: string }
 *               link: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: 수정 완료
 *       400:
 *         description: 유효하지 않은 id 또는 body
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 본인 상품 아님
 *       404:
 *         description: 상품 없음
 *   delete:
 *     tags: [Items]
 *     summary: 상품 삭제
 *     description: 본인 상품만 삭제 가능.
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 삭제 완료
 *       400:
 *         description: 유효하지 않은 id
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 본인 상품 아님
 *       404:
 *         description: 상품 없음
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: 프로필 조회
 *     description: 로그인된 사용자의 프로필 정보 (id, email, create_at 등).
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: 로그인 사용자 프로필
 *       401:
 *         description: 인증되지 않음
 */

/**
 * @swagger
 * /api/users/profile/password:
 *   patch:
 *     tags: [Users]
 *     summary: 비밀번호 변경 (사용자 프로필)
 *     description: 로그인된 사용자의 비밀번호를 새 비밀번호로 변경. body는 새 비밀번호만 전달.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, minLength: 8, description: "새 비밀번호 (8자 이상)" }
 *     responses:
 *       200:
 *         description: 비밀번호 변경 완료
 *       400:
 *         description: 비밀번호 누락 또는 8자 미만
 *       401:
 *         description: 인증되지 않음
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: 장바구니 목록
 *     description: 로그인 사용자의 장바구니 목록. 관리자/최고관리자는 budget 정보 포함.
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: data, items, total_amount, shipping_fee (관리자면 budget 포함)
 *       401:
 *         description: 인증되지 않음
 *   delete:
 *     tags: [Cart]
 *     summary: 장바구니 비우기
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: 장바구니 전체 삭제 완료
 *       401:
 *         description: 인증되지 않음
 */

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: 장바구니에 상품 추가
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id]
 *             properties:
 *               item_id: { type: string, description: "상품 ID" }
 *               quantity: { type: integer, default: 1 }
 *     responses:
 *       201:
 *         description: 추가 완료, 전체 장바구니 반환
 *       400:
 *         description: item_id 누락
 *       401:
 *         description: 인증되지 않음
 *       404:
 *         description: 상품 없음
 */

/**
 * @swagger
 * /api/cart/items/{id}:
 *   patch:
 *     tags: [Cart]
 *     summary: 장바구니 품목 수량 수정
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 장바구니 품목 ID (cart id)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: 수정 완료
 *       400:
 *         description: 유효하지 않은 id
 *       401:
 *         description: 인증되지 않음
 *       404:
 *         description: 품목 없음
 *   delete:
 *     tags: [Cart]
 *     summary: 장바구니 품목 1개 삭제
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 장바구니 품목 ID
 *     responses:
 *       200:
 *         description: 삭제 완료
 *       401:
 *         description: 인증되지 않음
 *       404:
 *         description: 품목 없음
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: 구매 요청 목록 (내 주문)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [request_date:asc, request_date:desc, created_at:asc, created_at:desc, order_amount:asc, order_amount:desc] }
 *     responses:
 *       200:
 *         description: data, pagination (summary_title, total_quantity, items 포함)
 *       401:
 *         description: 인증되지 않음
 *   post:
 *     tags: [Orders]
 *     summary: 주문 생성 (구매 요청)
 *     description: body 없으면 장바구니 기반. body.items 있으면 해당 품목으로. instant_purchase=true면 관리자만 즉시 승인.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items: { type: array, items: { type: object, properties: { item_id: { type: string }, quantity: { type: integer } } } }
 *               instant_purchase: { type: boolean, default: false, description: "관리자만. 즉시 승인 주문" }
 *     responses:
 *       201:
 *         description: 주문 생성 완료
 *       400:
 *         description: 장바구니 비어있음, 상품 없음, 예산 부족(즉시구매 시)
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 즉시 구매는 관리자만
 */

/**
 * @swagger
 * /api/orders/history:
 *   get:
 *     tags: [Orders]
 *     summary: 구매 확정 이력 (승인된 주문)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: data, summary, pagination
 *       401:
 *         description: 인증되지 않음
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: 주문 상세
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 주문 상세 (order_items, summary_title, total_quantity)
 *       401:
 *         description: 인증되지 않음
 *       404:
 *         description: 주문 없음
 *   delete:
 *     tags: [Orders]
 *     summary: 주문 취소 (pending만)
 *     description: 취소 시 해당 품목 장바구니 복원
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 취소 완료
 *       400:
 *         description: 승인 대기 중인 주문만 취소 가능
 *       401:
 *         description: 인증되지 않음
 *       404:
 *         description: 주문 없음
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: 관리자 주문 목록
 *     description: status=pending(구매요청관리), approved(구매내역), all
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, all], default: "pending" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: data, pagination (requester, is_instant_purchase 포함)
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 관리자 아님
 */

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: 관리자 주문 상세
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 주문 상세
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 관리자 아님
 *       404:
 *         description: 주문 없음
 *   patch:
 *     tags: [Admin]
 *     summary: 주문 승인/반려
 *     description: approved 시 예산 차감·상품 count 증가. cancelled 시 품목 장바구니 복원.
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, cancelled] }
 *     responses:
 *       200:
 *         description: 승인/반려 완료
 *       400:
 *         description: status 오류, 이미 처리됨, 예산 부족
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 관리자 아님
 *       404:
 *         description: 주문 없음
 */

/**
 * @swagger
 * /api/super-admin/invitations:
 *   post:
 *     tags: [Super Admin]
 *     summary: 초대 메일 발송
 *     description: 최고관리자만. 이메일로 가입 초대 링크 발송 (nodemailer)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: 초대 메일 발송 완료
 *       400:
 *         description: 이메일 누락/형식 오류
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 최고관리자 아님
 *       409:
 *         description: 이미 가입된 이메일
 */

/**
 * @swagger
 * /api/super-admin/users:
 *   get:
 *     tags: [Super Admin]
 *     summary: 전체 유저 목록
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: users, total
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 최고관리자 아님
 */

/**
 * @swagger
 * /api/super-admin/users/{id}:
 *   patch:
 *     tags: [Super Admin]
 *     summary: 유저 등급 수정
 *     description: is_admin, is_super_admin (Y/N 또는 boolean)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_admin: { type: string, enum: [Y, N] }
 *               is_super_admin: { type: string, enum: [Y, N] }
 *     responses:
 *       200:
 *         description: 수정 완료
 *       400:
 *         description: 잘못된 body
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 최고관리자 아님
 *       404:
 *         description: 유저 없음
 *   delete:
 *     tags: [Super Admin]
 *     summary: 유저 삭제 (탈퇴)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 삭제 완료
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 최고관리자 아님
 *       404:
 *         description: 유저 없음
 */

/**
 * @swagger
 * /api/super-admin/budget/current:
 *   get:
 *     tags: [Super Admin]
 *     summary: 이번 달 예산 조회
 *     description: budget_amount, spent_amount, remaining, initial_budget
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: budget, initial_budget
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 최고관리자 아님
 *   patch:
 *     tags: [Super Admin]
 *     summary: 예산 수정
 *     description: budget_amount, spent_amount, initial_budget (선택)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               budget_amount: { type: integer }
 *               spent_amount: { type: integer }
 *               initial_budget: { type: integer }
 *     responses:
 *       200:
 *         description: 수정 완료
 *       400:
 *         description: 잘못된 값
 *       401:
 *         description: 인증되지 않음
 *       403:
 *         description: 최고관리자 아님
 */

export {};