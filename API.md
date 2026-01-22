# 상품 API 문서

## 📋 엔드포인트 목록

### 1. 상품 목록 조회 (GET /api/items)

**인증**: 선택 (로그인 없이도 조회 가능)

**쿼리 파라미터**:
- `category_main` (string, optional): 메인 카테고리 (예: "음료", "스낵", "생수")
- `category_sub` (string, optional): 서브 카테고리 (예: "청량·탄산음료", "커뮤음료")
- `sort` (string, optional): 정렬 방식
  - `최신순` (기본값)
  - `판매순`
  - `낮은가격순`
  - `높은가격순`
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지당 항목 수 (기본값: 8, 최대: 100)

**요청 예시**:
```http
GET /api/items?category_main=음료&category_sub=청량·탄산음료&sort=최신순&page=1&limit=8
```

**응답 예시**:
```json
{
  "data": [
    {
      "id": "uuid-1234",
      "title": "코카콜라 제로",
      "price": 2000,
      "image": "https://example.com/cocacola.png",
      "category_main": "음료",
      "category_sub": "청량·탄산음료",
      "count": 29,
      "create_at": "2024-01-20T10:00:00.000Z",
      "updated_at": "2024-01-20T10:00:00.000Z",
      "user_id": "user-uuid",
      "user": {
        "name": "홍길동",
        "company_name": "코드잇"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 8,
    "totalCount": 50,
    "totalPages": 7,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### 2. 상품 상세 조회 (GET /api/items/:id)

**인증**: 선택

**URL 파라미터**:
- `id` (string, required): 상품 ID

**요청 예시**:
```http
GET /api/items/uuid-1234
```

**응답 예시**:
```json
{
  "id": "uuid-1234",
  "title": "코카콜라 제로",
  "price": 2000,
  "image": "https://example.com/cocacola.png",
  "category_main": "음료",
  "category_sub": "청량·탄산음료",
  "count": 29,
  "created_at": "2024-01-20T10:00:00.000Z",
  "updated_at": "2024-01-20T10:00:00.000Z",
  "seller": {
    "id": "user-uuid",
    "name": "홍길동",
    "email": "seller@example.com",
    "company_name": "코드잇"
  },
  "purchaseCount": 29,
  "isOwner": false
}
```

**필드 설명**:
- `purchaseCount`: 구매 횟수 (count와 동일)
- `isOwner`: 현재 로그인한 사용자가 판매자인지 여부 (로그인 시에만)

---

### 3. 상품 등록 (POST /api/items)

**인증**: 필수 (쿠키 또는 Authorization 헤더)

**요청 본문**:
```json
{
  "title": "코카콜라 제로",
  "price": 2000,
  "image": "https://example.com/cocacola.png",
  "category_main": "음료",
  "category_sub": "청량·탄산음료"
}
```

**필드 설명**:
- `title` (string, required): 상품명
- `price` (number, required): 가격 (0 이상)
- `image` (string, optional): 이미지 URL (빈 문자열 가능)
- `category_main` (string, required): 메인 카테고리
- `category_sub` (string, required): 서브 카테고리

**응답 예시**:
```json
{
  "message": "상품이 등록되었습니다.",
  "item": {
    "id": "uuid-1234",
    "title": "코카콜라 제로",
    "price": 2000,
    "image": "https://example.com/cocacola.png",
    "category_main": "음료",
    "category_sub": "청량·탄산음료",
    "count": 0,
    "created_at": "2024-01-20T10:00:00.000Z",
    "seller": {
      "id": "user-uuid",
      "name": "홍길동",
      "company_name": "코드잇"
    }
  }
}
```

**에러 응답**:
- `400`: 필수 항목 누락 또는 유효하지 않은 값
- `401`: 인증 필요

---

### 4. 상품 수정 (PATCH /api/items/:id)

**인증**: 필수 (본인 상품만 수정 가능)

**URL 파라미터**:
- `id` (string, required): 상품 ID

**요청 본문** (모든 필드 선택):
```json
{
  "title": "코카콜라 제로 (수정)",
  "price": 2500,
  "image": "https://example.com/new-image.png",
  "category_main": "음료",
  "category_sub": "청량·탄산음료"
}
```

**응답 예시**:
```json
{
  "message": "상품이 수정되었습니다.",
  "item": {
    "id": "uuid-1234",
    "title": "코카콜라 제로 (수정)",
    "price": 2500,
    "image": "https://example.com/new-image.png",
    "category_main": "음료",
    "category_sub": "청량·탄산음료",
    "count": 29,
    "updated_at": "2024-01-20T11:00:00.000Z",
    "seller": {
      "id": "user-uuid",
      "name": "홍길동",
      "company_name": "코드잇"
    }
  }
}
```

**에러 응답**:
- `400`: 유효하지 않은 값
- `401`: 인증 필요
- `403`: 수정 권한 없음 (다른 사용자의 상품)
- `404`: 상품을 찾을 수 없음

---

### 5. 상품 삭제 (DELETE /api/items/:id)

**인증**: 필수 (본인 상품만 삭제 가능)

**URL 파라미터**:
- `id` (string, required): 상품 ID

**요청 예시**:
```http
DELETE /api/items/uuid-1234
```

**응답 예시**:
```json
{
  "success": true,
  "message": "상품이 삭제되었습니다."
}
```

**에러 응답**:
- `401`: 인증 필요
- `403`: 삭제 권한 없음 (다른 사용자의 상품)
- `404`: 상품을 찾을 수 없음

---

## 🎨 프론트엔드 연동 예시

### 1. 상품 목록 조회

```typescript
// lib/api/items.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const getItemsAPI = async (params: {
  category_main?: string;
  category_sub?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.category_main) queryParams.append("category_main", params.category_main);
  if (params.category_sub) queryParams.append("category_sub", params.category_sub);
  if (params.sort) queryParams.append("sort", params.sort);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const response = await fetch(
    `${API_URL}/api/items?${queryParams.toString()}`,
    {
      method: "GET",
      credentials: "include", // 쿠키 전송 (선택)
    }
  );

  if (!response.ok) {
    throw new Error("상품 목록을 불러오는데 실패했습니다.");
  }

  return response.json();
};
```

### 2. 상품 상세 조회

```typescript
export const getItemByIdAPI = async (itemId: string) => {
  const response = await fetch(`${API_URL}/api/items/${itemId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("상품 정보를 불러오는데 실패했습니다.");
  }

  return response.json();
};
```

### 3. 상품 등록

```typescript
export const createItemAPI = async (data: {
  title: string;
  price: number;
  image?: string;
  category_main: string;
  category_sub: string;
}) => {
  const response = await fetch(`${API_URL}/api/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // 쿠키 전송 (필수)
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "상품 등록에 실패했습니다.");
  }

  return response.json();
};
```

### 4. React Query 사용 예시

```typescript
// hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItemsAPI, getItemByIdAPI, createItemAPI } from "@/lib/api/items";

// 상품 목록 조회
export const useItems = (params: {
  category_main?: string;
  category_sub?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => getItemsAPI(params),
  });
};

// 상품 상세 조회
export const useItem = (itemId: string) => {
  return useQuery({
    queryKey: ["item", itemId],
    queryFn: () => getItemByIdAPI(itemId),
    enabled: !!itemId,
  });
};

// 상품 등록
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItemAPI,
    onSuccess: () => {
      // 상품 목록 다시 불러오기
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};
```

### 5. 페이지 컴포넌트에서 사용

```typescript
"use client";

import { useState } from "react";
import { useItems } from "@/hooks/useItems";

export default function ItemsPage() {
  const [categoryMain, setCategoryMain] = useState("음료");
  const [categorySub, setCategorySub] = useState("청량·탄산음료");
  const [sortOption, setSortOption] = useState("최신순");
  const [page, setPage] = useState(1);

  // 상품 목록 조회
  const { data, isLoading, error } = useItems({
    category_main: categoryMain,
    category_sub: categorySub,
    sort: sortOption,
    page,
    limit: 8,
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <div>
      {/* 상품 목록 */}
      <div className="grid grid-cols-4 gap-6">
        {data?.data.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>

      {/* 더보기 버튼 */}
      {data?.pagination.hasNextPage && (
        <button onClick={() => setPage(page + 1)}>
          더보기
        </button>
      )}
    </div>
  );
}
```

---

## 📚 카테고리 목록

### 메인 카테고리
- 스낵
- 음료
- 생수
- 간편식
- 신선식품
- 원두커피
- 비품

### 서브 카테고리 (음료)
- 청량·탄산음료
- 커뮤음료
- 에너지음료
- 원두커피
- 건강음료

---

## 🔒 인증

- **GET 엔드포인트**: 로그인 선택 (로그인하지 않아도 조회 가능)
- **POST/PATCH/DELETE 엔드포인트**: 로그인 필수

쿠키 기반 인증이므로 모든 요청에 `credentials: "include"` 추가 권장

---

## ⚠️ 주의사항

1. **페이지네이션**: `limit`는 최대 100까지만 가능
2. **이미지**: 현재는 URL만 저장 (파일 업로드는 별도 구현 필요)
3. **가격**: 정수로 저장 (소수점 자동 버림)
4. **권한**: 본인이 등록한 상품만 수정/삭제 가능
