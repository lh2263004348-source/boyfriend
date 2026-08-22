import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/** 初始化 S3 客户端（指向 Cloudflare R2） */
function createS3Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }
  return bucket;
}

function getPublicUrl(fileKey: string): string {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("R2_PUBLIC_URL is not configured");
  }
  return `${base}/${fileKey}`;
}

/**
 * 上传文件到 Cloudflare R2
 * @returns fileKey（持久化存库）与公开访问 URL
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ fileKey: string; url: string }> {
  const s3Client = createS3Client();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    fileKey: fileName,
    url: getPublicUrl(fileName),
  };
}

/** PRD 架构中的 R2 客户端工厂 */
export function createR2Client(): S3Client {
  return createS3Client();
}
