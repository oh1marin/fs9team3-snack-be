# FE 예산 시스템 연동 가이드

## 1. 장바구니 페이지 (GET /api/cart)

### 응답 구조

```json
{
  "data": [...],
  "items": [...],
  "total_amount": 15000,
  "shipping_fee": 3000,
  "budget": {
    "budget_amount": 3000000,
    "spent_amount": 250000,
    "remaining": 2750000,
    "initial_budget": 3000000
  }
}
```

### 표시 규칙

| 사용자                  | budget 필드        | 표시              |
| ----------------------- | ------------------ | ----------------- |
| **일반 사용자**         | 없음 (`undefined`) | 예산 관련 UI 숨김 |
| **관리자 / 최고관리자** | 있음               | 예산 표시         |

### 레이아웃 (총 주문금액 바로 아래)

```
총 주문금액: 15,000원
배송비: 3,000원
──────────────
합계: 18,000원

[관리자/최고관리자만 보임]
월 예산: 3,000,000원
시작 예산: 3,000,000원
남은 예산: 2,750,000원
```

- **월 예산** = `budget.budget_amount` (이번 달 설정된 예산)
- **시작 예산** = `budget.initial_budget` (매달 기본값, 다음 달에도 적용)
- **남은 예산** = `budget.remaining` (= budget_amount - spent_amount)

---

## 2. 예산 API (최고관리자 전용)

### GET /api/super-admin/budget/current

이번 달 예산 + 시작 예산 조회

```json
{
  "success": true,
  "budget": {
    "id": "...",
    "year": 2026,
    "month": 2,
    "budget_amount": 3000000,
    "spent_amount": 250000,
    "remaining": 2750000,
    "created_at": "...",
    "updated_at": "..."
  },
  "initial_budget": {
    "id": "...",
    "amount": 3000000,
    "updated_at": "..."
  }
}
```

### PATCH /api/super-admin/budget/current

월 예산 또는 시작 예산 수정

**요청 body (선택):**

```json
{
  "budget_amount": 4000000,
  "initial_budget": 3500000
}
```

| 필드             | 설명                                    |
| ---------------- | --------------------------------------- |
| `budget_amount`  | 이번 달 월 예산 (이번 달에만 적용)      |
| `initial_budget` | 시작 예산 (다음 달부터의 기본값)        |
| `spent_amount`   | 사용액 (수동 보정용, 일반적으로 미사용) |

**예시**

- 이번 달만 400만원 쓰고 싶음 → `{ "budget_amount": 4000000 }`
- 다음 달 기본값을 350만원으로 변경 → `{ "initial_budget": 3500000 }`
- 둘 다 수정 → `{ "budget_amount": 4000000, "initial_budget": 3500000 }`

---

## 3. 예산 개념 정리

| 용어          | 설명                                                                  |
| ------------- | --------------------------------------------------------------------- |
| **시작 예산** | 매달의 기본 예산. 새 월이 되면 이 값으로 시작                         |
| **월 예산**   | 해당 월에만 사용하는 예산. 이번 달만 조정 가능                        |
| **예시**      | 시작 300만 → 이번 달 400만으로 변경 → 다음 달은 다시 300만(시작 예산) |

---

## 4. 상품 구매 시 예산 차감

- 관리자/최고관리자가 **주문 승인** 또는 **즉시 구매** 시
- **상품금액 + 배송비**가 자동으로 예산 `spent_amount`에서 차감됨

### FE 결제 전 예산 체크 (권장)

장바구니 페이지에서 `budget.remaining`과 `total_amount + shipping_fee`를 비교해 **예산 초과 시 결제/주문 버튼 비활성화** 처리:

```javascript
// 장바구니 응답 예시
const { budget, total_amount, shipping_fee } = cartData;
const orderTotal = total_amount + shipping_fee; // 실제 결제 금액

// 관리자/최고관리자만 budget 있음
if (budget) {
  const isOverBudget = budget.remaining < orderTotal;
  // isOverBudget이면 주문/결제 버튼 비활성화 + "남은 예산 부족" 문구 표시
}
```

| 항목               | 값                                        |
| ------------------ | ----------------------------------------- |
| `budget.remaining` | 남은 예산 (원)                            |
| `total_amount`     | 상품 합계                                 |
| `shipping_fee`     | 배송비 (기본 3000)                        |
| 초과 여부          | `remaining < total_amount + shipping_fee` |

### BE 동작

- **즉시 구매** 또는 **주문 승인** 시 BE가 예산 검증 수행
- `remaining < (주문금액 + 배송비)` 이면 **400** 반환:

```json
{
  "message": "예산이 부족합니다.",
  "remaining": 50000,
  "required": 18000
}
```

- FE에서도 사전 체크해 UX 개선 권장

---

## 5. 구매 내역 vs 예산 사용액 (중요)

**예산 spent_amount**는 **주문마다 배송비(3,000원)가 포함**됩니다.

| 구분               | 계산 방식                       |
| ------------------ | ------------------------------- |
| 구매 내역 상품합계 | Σ order.total_amount (상품만)   |
| 예산 실제 차감액   | Σ (order.total_amount + 배송비) |

→ **주문 100건**이면 상품 2,970만 + 배송비 30만 = **3,000만** (spent_amount)

### GET /api/orders/history 응답

각 주문에 `shipping_fee`, `amount_with_shipping` 포함:

```json
{
  "data": [
    {
      "id": "...",
      "total_amount": 15000,
      "shipping_fee": 3000,
      "amount_with_shipping": 18000,
      ...
    }
  ],
  "summary": {
    "total_product_amount": 150000,
    "total_shipping": 30000,
    "total_deducted": 180000,
    "order_count": 10
  }
}
```

- `amount_with_shipping` = 예산에서 실제로 빠진 금액 (total_amount + shipping_fee)
- `summary.total_deducted` = 현재 페이지 주문들의 예산 차감 합계
