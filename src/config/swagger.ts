import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Snack Backend API",
      version: "1.0.0",
      description: `Snack 백엔드 API. 쿠키 기반 인증.
FE: Base URL은 \`NEXT_PUBLIC_API_URL\`, 모든 요청에 \`credentials: 'include'\` 필요.`,
    },
    servers: [
      { url: "http://localhost:3001", description: "개발 서버 (FE Base URL: NEXT_PUBLIC_API_URL)" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description:
            "로그인/회원가입 후 서버가 설정하는 accessToken 쿠키. FE에서는 fetch 옵션에 credentials: 'include' 를 반드시 넣어야 쿠키가 전송됩니다.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "에러 메시지" },
          },
          description: "에러 시 공통 응답",
        },
      },
    },
    tags: [
      { name: "Auth", description: "인증 (회원가입, 로그인, 로그아웃, 토큰 갱신, 비밀번호 변경)" },
      { name: "Items", description: "상품 CRUD (목록·상세·등록·수정·삭제)" },
      { name: "Users", description: "사용자 프로필·비밀번호 변경" },
    ],
  },
  apis: ["./src/swagger-docs.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
