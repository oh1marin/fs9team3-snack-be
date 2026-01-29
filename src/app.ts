// src/app.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import itemsRoutes from "./routes/items.routes";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";
import swaggerSpec from "./config/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // 이미지 base64 업로드를 위해 크기 제한 증가
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 라우트
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/users", userRoutes);

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