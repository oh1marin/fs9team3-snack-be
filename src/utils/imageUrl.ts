/**
 * 상품 API 응답용: 상대 경로(/uploads/...)를 API 기준 절대 URL로 변환.
 * FE에서 상대 경로가 안 뜨므로 GET /api/items, GET /api/items/:id 에서 사용.
 */
export function toAbsoluteImageUrl(url: string | null | undefined): string {
  if (url == null || url === "") return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.API_BASE_URL?.trim();
  if (!base) return url;
  const baseTrimmed = base.replace(/\/$/, "");
  return url.startsWith("/") ? `${baseTrimmed}${url}` : url;
}
