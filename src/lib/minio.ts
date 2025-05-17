
import { S3Client } from "@aws-sdk/client-s3";

const MINIO_ENDPOINT = process.env.NEXT_PUBLIC_MINIO_ENDPOINT;
const MINIO_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY_ID;
const MINIO_SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_MINIO_SECRET_ACCESS_KEY;
const MINIO_USE_SSL = process.env.NEXT_PUBLIC_MINIO_USE_SSL === 'true';
// MinIO typically doesn't care about region, but AWS SDK S3 client requires one.
// 'us-east-1' is a common default that works for MinIO.
const MINIO_REGION = process.env.NEXT_PUBLIC_MINIO_REGION || 'us-east-1'; 

if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY_ID || !MINIO_SECRET_ACCESS_KEY) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      "MinIO environment variables (NEXT_PUBLIC_MINIO_ENDPOINT, NEXT_PUBLIC_MINIO_ACCESS_KEY_ID, NEXT_PUBLIC_MINIO_SECRET_ACCESS_KEY) are not fully set. MinIO functionality will be disabled."
    );
  } else {
    // In production, you might want to throw an error if these are critical
    // For now, we'll allow the app to run but MinIO features won't work.
     console.error(
      "MinIO environment variables are not fully set. MinIO functionality will be disabled."
    );
  }
}

let s3Client: S3Client | null = null;

if (MINIO_ENDPOINT && MINIO_ACCESS_KEY_ID && MINIO_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: MINIO_REGION,
    credentials: {
      accessKeyId: MINIO_ACCESS_KEY_ID,
      secretAccessKey: MINIO_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Crucial for MinIO, ensures bucket name is in the path
    tls: MINIO_USE_SSL,
  });
}


export const minioS3Client = s3Client;
export const MINIO_BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET_NAME;

if (!MINIO_BUCKET_NAME && s3Client) {
   if (process.env.NODE_ENV === 'development') {
    console.warn(
      "MinIO environment variable NEXT_PUBLIC_MINIO_BUCKET_NAME is not set. MinIO functionality will be impaired."
    );
  } else {
     console.error(
      "MinIO environment variable NEXT_PUBLIC_MINIO_BUCKET_NAME is not set. MinIO functionality will be impaired."
    );
  }
}
