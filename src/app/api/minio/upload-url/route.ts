
import { NextRequest, NextResponse } from 'next/server';
import { minioS3Client, MINIO_BUCKET_NAME } from '@/lib/minio';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  if (!minioS3Client || !MINIO_BUCKET_NAME) {
    return NextResponse.json(
      { error: 'MinIO client or bucket not configured correctly on the server.' },
      { status: 500 }
    );
  }

  try {
    const { fileName, fileType, projectId, instancePin } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required in the request body.' },
        { status: 400 }
      );
    }
    
    if (!projectId || !instancePin) {
        return NextResponse.json(
            { error: 'projectId and instancePin are required for organizing uploads.'},
            { status: 400}
        );
    }

    // Construct a unique object key for MinIO
    // Example: media/INSTANCE_PIN/PROJECT_ID/UUID-originalFileName.ext
    const objectKey = `media/${instancePin}/${projectId}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: MINIO_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
      // ACL: 'public-read', // Set this if your objects need to be publicly readable by default.
                             // Otherwise, you'll need to generate presigned GET URLs for viewing.
                             // For presigned PUT, ACL might not be strictly necessary if bucket policies are set.
    });

    // The presigned URL will be valid for 1 hour (3600 seconds)
    const expiresIn = 3600; 
    const presignedUrl = await getSignedUrl(minioS3Client, command, { expiresIn });

    // The client will use this URL with a PUT request to upload the file.
    return NextResponse.json({ 
      success: true, 
      presignedUrl, 
      objectKey,
      method: 'PUT' // Inform client to use PUT method
    });

  } catch (error) {
    let errorMessage = 'Failed to generate upload URL.';
    if (error instanceof Error) {
        // Avoid exposing too much internal detail in client-facing error messages
        // Log the full error on the server for debugging
        if (error.name === 'CredentialsProviderError') {
             errorMessage = 'Server-side MinIO credentials are not configured correctly.'
        } else if (error.name === 'NoSuchBucket') {
            errorMessage = `The configured MinIO bucket "${MINIO_BUCKET_NAME}" does not exist.`
        }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
