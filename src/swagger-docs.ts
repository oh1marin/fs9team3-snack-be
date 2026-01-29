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
 *     summary: 토큰 갱신 (refreshToken 쿠키 사용)
 *     description: refreshToken 쿠키로 accessToken 재발급. FE에서 401 전에 호출해 세션 연장 가능.
 *     responses:
 *       200:
 *         description: accessToken 갱신, 쿠키 재설정
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
 *     responses:
 *       200:
 *         description: { data, pagination } 형식으로 상품 배열 및 페이지 정보
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

export {};
