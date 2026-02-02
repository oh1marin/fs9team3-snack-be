import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3 클라이언트 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION 사용)
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

/**
 * 상품 이미지 업로드 미들웨어
 * - AWS_PUBLIC_BUCKET_NAME 설정 시: S3 퍼블릭 버킷에 업로드
 * - 미설정 시: memoryStorage (이미지 URL은 req.body.image로 전달)
 */
// multer-s3와 @aws-sdk/client-s3 버전 불일치로 타입 단언 사용
const s3Storage = process.env.AWS_PUBLIC_BUCKET_NAME
  ? multerS3({
      s3: s3 as never,
      bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
      },
    })
  : multer.memoryStorage();

export const uploadToS3 = multer({
  storage: s3Storage,
});
