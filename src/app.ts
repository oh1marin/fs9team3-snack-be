// src/app.ts
// 이미지 업로드(upload.ts) 등에서 env를 쓰므로 .env를 가장 먼저 로드
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import itemsRoutes from "./routes/items.routes";
import userRoutes from "./routes/userRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import { errorHandler } from "./middleware/errorHandler";
import swaggerSpec from "./config/swagger";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: 로컬 + 배포 프론트. CORS_ORIGIN에 호스트만 있어도 같은 호스트 다른 포트 허용
const corsOriginList = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : [
      "http://localhost:3000",
      "http://localhost:4000",
      "https://fs9team3-snack-fe.vercel.app",
      "https://marin-snack.store",
      "https://www.marin-snack.store",
    ];
const corsOriginHosts = corsOriginList.map((u) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
}).filter(Boolean);

function corsOrigin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return cb(null, true);
  if (corsOriginList.includes(origin)) return cb(null, true);
  try {
    const host = new URL(origin).hostname;
    if (corsOriginHosts.includes(host)) return cb(null, true);
  } catch {}
  cb(null, false);
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // 이미지 base64 업로드를 위해 크기 제한 증가
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 라우트 url 경로
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Snack Backend API",
    status: "running",
  });
});

// API 문서 (Swagger UI) - /api-docs
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Snack API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ message: "존재하지 않는 경로입니다." });
});

// 에러 핸들러 (반드시 모든 라우트 뒤에 위치)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
});