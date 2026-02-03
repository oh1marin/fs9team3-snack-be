"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
// 이미지 업로드(upload.ts) 등에서 env를 쓰므로 .env를 가장 먼저 로드
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const items_routes_1 = __importDefault(require("./routes/items.routes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = __importDefault(require("./config/swagger"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS: 로컬 + 배포 프론트. CORS_ORIGIN에 호스트만 있어도 같은 호스트 다른 포트 허용
const corsOriginList = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
    : ["http://localhost:3000", "http://localhost:4000"];
const corsOriginHosts = corsOriginList.map((u) => {
    try {
        return new URL(u).hostname;
    }
    catch {
        return "";
    }
}).filter(Boolean);
function corsOrigin(origin, cb) {
    if (!origin)
        return cb(null, true);
    if (corsOriginList.includes(origin))
        return cb(null, true);
    try {
        const host = new URL(origin).hostname;
        if (corsOriginHosts.includes(host))
            return cb(null, true);
    }
    catch { }
    cb(null, false);
}
app.use((0, cors_1.default)({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" })); // 이미지 base64 업로드를 위해 크기 제한 증가
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// 라우트
app.use("/api/auth", authRoutes_1.default);
app.use("/api/items", items_routes_1.default);
app.use("/api/users", userRoutes_1.default);
// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Snack Backend API",
        status: "running",
    });
});
// API 문서 (Swagger UI) - /api-docs
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customSiteTitle: "Snack API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
}));
// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ message: "존재하지 않는 경로입니다." });
});
// 에러 핸들러 (반드시 모든 라우트 뒤에 위치)
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API docs: http://localhost:${PORT}/api-docs`);
});
