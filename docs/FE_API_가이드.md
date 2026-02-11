# FE 연동 가이드 (API 및 화면 흐름)

## 공통

- **인증**: 필요한 API는 `Authorization: Bearer <token>` 또는 쿠키 `accessToken` 사용.
- **Base URL**: 배포 시 백엔드 주소 (예: `https://api.marin-snack.store`).

---

## 1. 장바구니 (Cart)

### GET /api/cart
- **인증**: 필요
- **응답**: `{ data: [...], items: [...] }` (동일 배열)
- **각 항목**:
  - `id`, `item_id`, `user_id`, `quantity`
  - **`total_price`**: 해당 줄 합계 (금액 × 수량)
  - **`price`**, **`unit_price`**: **개당 금액(단가)** (줄 합계 아님)
  - `item`: 상품 정보 (title, image, price 등)
  - `image`, `image_url`: FE 이미지용 (item.image와 동일)

### POST /api/cart/items
- **Body**: `{ item_id: string, quantity?: number }`
- **응답**: `{ message, cart: { ...항목 } }` — cart에도 `price`, `unit_price`, `total_price` 포함

### PATCH /api/cart/items/:id
- **Body**: `{ quantity: number }`
- **응답**: `{ message, cart: { ... } }` — 동일하게 단가·줄 합계 포함

---

## 2. 주문 (구매 요청)

### POST /api/orders — 구매요청 생성
- **인증**: 필요
- **전체 장바구니로 주문**: body 없음 또는 `{}`
- **일부만 주문**: `{ items: [ { item_id: string, quantity: number }, ... ] }`
- **동작**:
  - 주문(orders) 생성 + **요청한 품목만 장바구니에서 삭제** (한 트랜잭션, 실패 시 둘 다 롤백)
- **응답 201**: `{ message: "주문이 생성되었습니다.", data: order }`
- **FE 흐름**:
  1. 장바구니 페이지에서 "구매요청" 클릭 → `POST /api/orders` 호출
  2. 성공 시 **구매요청(주문) 페이지로 이동**
  3. "장바구니로 돌아가기"는 **일부만 주문했거나 장바구니에 남은 상품이 있을 때만** 노출  
     → 필요 시 `GET /api/cart`로 `data.length > 0`이면 버튼 표시

### GET /api/orders — 내 구매 요청 목록
- **인증**: 필요
- **Query**: `page`, `limit`, `sort` (예: `request_date:desc`, `request_date:asc`, `created_at:desc`, `created_at:asc`)
- **응답**:
  - `data[]`: 각 주문
    - **`summary_title`**: 대표 상품명 (가나다 순 첫 상품 + " 및 N개") — 예: "코카콜라 제로 및 1개"
    - **`total_quantity`**: 총 수량 (모든 품목 quantity 합)
    - **`total_amount`**: 주문 금액
    - **`status`**: `pending` | `approved` | `cancelled`
    - **`request_date`**: 구매요청일
    - **`items`** / **`order_items`**: 품목 배열, 각 항목에 `category`, `category_sub`, `category_main`, `item`(title 등), `quantity`, `total_price`
    - `first_item_image`, `image`, `image_url`: 대표 이미지
  - `pagination`: `{ page, limit, total, totalPages }`
- **테이블 매핑 예**:
  - 구매요청일: `request_date`
  - 상품정보: `summary_title` (아래 줄에 "총 수량: N개" → `total_quantity`)
  - 주문 금액: `total_amount`
  - 상태: `status` → "승인 대기" / "승인" / "취소" 등 문구 매핑
  - 비고: "요청 취소" 버튼 → `DELETE /api/orders/:id`

### GET /api/orders/:id — 주문 상세
- **인증**: 필요 (본인 주문만)
- **응답**: 동일하게 `summary_title`, `total_quantity`, `items`, `order_items`, `total_amount`, `status` 등

### GET /api/orders/history — 구매 확정 이력 (승인된 주문만)
- **인증**: 필요
- **Query**: `page`, `limit`
- **응답**: `{ data: [...], pagination }`
- **각 항목**: `order_id`, `total_amount`, `approved_at`, `summary_title`, `total_quantity`, `items` 등

### DELETE /api/orders/:id — 요청 취소
- **인증**: 필요 (본인만)
- **조건**: `status === "pending"` 일 때만
- **동작**: 주문 취소 후 **해당 주문 품목을 해당 유저 장바구니에 다시 넣음** (트랜잭션, 둘 다 성공 시에만 반영)
- **응답**: `{ success: true, message: "요청이 취소되었습니다. 해당 상품이 장바구니에 다시 담겼습니다." }`
- **FE**: 성공 시 `refetchCart()` 호출해 장바구니/헤더 개수 갱신, 위 메시지로 토스트 표시

---

## 3. 관리자 (Admin) — 구매요청 관리

- **권한**: 로그인 사용자 중 `is_admin === "Y"` 만. 아니면 **403**.
- **역할**: 일반 사용자들이 요청한 주문을 보고, **승인(approved)** / **반려(cancelled)** 처리.

### GET /api/admin/orders
- **용도**: 구매 요청 관리 목록 — **모든 사용자의 주문** (user_id 조건 없음, 관리자만 전체 조회).
- **Query**: `page`, `limit`, `sort` (예: `request_date:desc`).
- **응답**: `{ data: [ { id, summary_title, total_quantity, total_amount, status, request_date, items, ... } ], pagination }` — FE가 그대로 사용 가능.

### GET /api/admin/orders/:id
- **용도**: 관리자 주문 상세 (아무 주문이나 조회)
- **응답 형식**: `GET /api/orders/:id`와 동일

### PATCH /api/admin/orders/:id — 승인 / 반려
- **권한**: 관리자만. **어떤 사용자의 주문이든** 주문 `id`만 맞으면 수정 가능 (본인 주문만 아님).
- **Body**:
  - 허용: `{ "status": "approved" }`
  - 거절: `{ "status": "cancelled" }` — 반려 시 **해당 주문 품목을 주문한 유저의 장바구니에 다시 넣음** (유저 요청 취소와 동일 로직)
- **조건**: 해당 주문이 `pending` 일 때만.
- **응답**: `{ success: true, message: "승인되었습니다." | "반려되었습니다.", data: order }`
- **FE**: `fetchAdminOrders()` → GET /api/admin/orders, 허용 → `updateAdminOrderStatus(id, 'approved')`, 거절 → `updateAdminOrderStatus(id, 'cancelled')`. 성공 시 토스트 + 목록 다시 불러오기.

---

## 4. 상품 등록 내역 (관리자)

- **테이블**: 등록일, 상품명, 카테고리, 가격
- **API**: **GET /api/items** (기존)
- **매핑**:
  - 등록일: `item.create_at`
  - 상품명: `item.title`
  - 카테고리: `item.category_sub` 또는 `item.category_main`
  - 가격: `item.price`
- **정렬**: `sort=최신순` (기본) → 등록일 최신순

---

## 5. 요약 표

| 화면/동작 | API | 비고 |
|-----------|-----|------|
| 장바구니 목록 | GET /api/cart | `price`, `unit_price` = 단가, `total_price` = 줄 합계 |
| 구매요청하기 | POST /api/orders | 성공 시 주문 페이지로 이동, 요청한 품목만 장바구니에서 삭제 |
| 구매 요청 내역 | GET /api/orders | `summary_title`, `total_quantity`, `total_amount`, `status` |
| 구매 확정 이력 | GET /api/orders/history | 승인된 주문만 |
| 요청 취소 | DELETE /api/orders/:id | pending만 가능 |
| 관리자 주문 목록/상세 | GET /api/admin/orders, GET /api/admin/orders/:id | 응답 형식 동일 |
| 승인/반려 | PATCH /api/admin/orders/:id | body: `{ status: "approved" \| "cancelled" }` |
| 상품 등록 내역 | GET /api/items | create_at, title, category_sub/category_main, price |
