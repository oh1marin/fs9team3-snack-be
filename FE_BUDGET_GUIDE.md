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

| 사용자 | budget 필드 | 표시 |
|--------|-------------|------|
| **일반 사용자** | 없음 (`undefined`) | 예산 관련 UI 숨김 |
| **관리자 / 최고관리자** | 있음 | 예산 표시 |

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

| 필드 | 설명 |
|------|------|
| `budget_amount` | 이번 달 월 예산 (이번 달에만 적용) |
| `initial_budget` | 시작 예산 (다음 달부터의 기본값) |
| `spent_amount` | 사용액 (수동 보정용, 일반적으로 미사용) |

**예시**
- 이번 달만 400만원 쓰고 싶음 → `{ "budget_amount": 4000000 }`
- 다음 달 기본값을 350만원으로 변경 → `{ "initial_budget": 3500000 }`
- 둘 다 수정 → `{ "budget_amount": 4000000, "initial_budget": 3500000 }`

---

## 3. 예산 개념 정리

| 용어 | 설명 |
|------|------|
| **시작 예산** | 매달의 기본 예산. 새 월이 되면 이 값으로 시작 |
| **월 예산** | 해당 월에만 사용하는 예산. 이번 달만 조정 가능 |
| **예시** | 시작 300만 → 이번 달 400만으로 변경 → 다음 달은 다시 300만(시작 예산) |

---

## 4. 상품 구매 시 예산 차감

- 관리자/최고관리자가 **주문 승인** 또는 **즉시 구매** 시
- **상품금액 + 배송비**가 자동으로 예산 `spent_amount`에서 차감됨
- FE에서는 별도 처리 불필요
