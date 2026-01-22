// 상품 관련 타입 정의

export interface Item {
  id: string;
  title: string;
  price: number;
  image: string;
  category_main: string;
  category_sub: string;
  count: number;
  user_id: string;
  create_at: Date;
  updated_at: Date;
}

export interface ItemWithSeller extends Omit<Item, "user_id"> {
  seller: {
    id: string;
    name: string | null;
    email: string;
    company_name: string;
  };
  purchaseCount: number;
  isOwner?: boolean;
}

export interface CreateItemRequest {
  title: string;
  price: number;
  image?: string;
  category_main: string;
  category_sub: string;
}

export interface UpdateItemRequest {
  title?: string;
  price?: number;
  image?: string;
  category_main?: string;
  category_sub?: string;
}

export interface ItemsQuery {
  category_main?: string;
  category_sub?: string;
  sort?: "최신순" | "판매순" | "낮은가격순" | "높은가격순";
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ItemsResponse {
  data: Item[];
  pagination: PaginationInfo;
}

// 카테고리 상수
export const CATEGORY_MAIN = {
  SNACK: "스낵",
  BEVERAGE: "음료",
  WATER: "생수",
  CONVENIENCE_FOOD: "간편식",
  FRESH_FOOD: "신선식품",
  COFFEE_BEANS: "원두커피",
  SUPPLIES: "비품",
} as const;

export const CATEGORY_SUB_BEVERAGE = {
  SOFT_DRINK: "청량·탄산음료",
  COFFEE_DRINK: "커뮤음료",
  ENERGY_DRINK: "에너지음료",
  COFFEE_BEANS: "원두커피",
  HEALTH_DRINK: "건강음료",
} as const;

export type CategoryMain = (typeof CATEGORY_MAIN)[keyof typeof CATEGORY_MAIN];
export type CategorySubBeverage = (typeof CATEGORY_SUB_BEVERAGE)[keyof typeof CATEGORY_SUB_BEVERAGE];
