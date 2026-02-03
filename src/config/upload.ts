import type { Request } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 클라이언트 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION 사용)
 */
export const s3Client = new S3Client({
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
      s3: s3Client as never,
      bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
      acl: 'public-read', 
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, key: string) => void
      ) => {
        cb(null, `${Date.now()}_${file.originalname}`);
      },
    })
  : multer.memoryStorage();

export const uploadToS3 = multer({
  storage: s3Storage,
});

/** 퍼블릭 버킷 객체 URL (버킷이 퍼블릭 읽기 허용일 때). multer-s3 + SDK v3는 Location 미반환 시 사용 */
export function getPublicObjectUrl(bucket: string, key: string): string {
  const region = process.env.AWS_REGION || "ap-northeast-2";
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

/**
 * Presigned URL: 클라이언트가 이 URL로 PUT 하면 S3에 직접 업로드됨
 * @param bucket 버킷 이름 (AWS_PUBLIC_BUCKET_NAME 권장)
 * @param key S3 객체 키 (예: "1234567890_photo.jpg")
 * @param expiresIn 만료 시간(초), 기본 15분
 */
export async function getPresignedUploadUrl(
  bucket: string,
  key: string,
  expiresIn = 900
): Promise<string> {
  const url = await getSignedUrl(
    s3Client as never,
    new PutObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
  return url;
}

/**
 * Presigned URL: 프라이빗 버킷 객체를 일시적으로 조회할 때 사용
 * @param bucket 버킷 이름 (AWS_PRIVATE_BUCKET_NAME)
 * @param key S3 객체 키
 * @param expiresIn 만료 시간(초), 기본 1시간
 */
export async function getPresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const url = await getSignedUrl(
    s3Client as never,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
  return url;
}

/**
 * Presigned 업로드 URL + 업로드 후 사용할 이미지 URL 반환
 * 클라이언트: 1) PUT으로 uploadUrl에 파일 업로드 → 2) imageUrl을 상품 등록/수정 API의 image 필드로 전달
 */
export async function createPresignedUpload(
  filename?: string
): Promise<{ uploadUrl: string; key: string; imageUrl: string }> {
  const bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
  if (!bucket) {
    throw new Error("AWS_PUBLIC_BUCKET_NAME이 설정되지 않았습니다.");
  }
  const key = `${Date.now()}_${filename || "image"}`.replace(/\s/g, "_");
  const uploadUrl = await getPresignedUploadUrl(bucket, key);
  const imageUrl = getPublicObjectUrl(bucket, key);
  return { uploadUrl, key, imageUrl };
}
