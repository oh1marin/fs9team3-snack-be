import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import itemsRoutes from "./routes/items.routes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"], // 프론트엔드 주소
    credentials: true, // ✅ 쿠키 전송 허용 (필수!)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser()); // ✅ 쿠키 파서 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "존재하지 않는 경로입니다." });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  },
);

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
