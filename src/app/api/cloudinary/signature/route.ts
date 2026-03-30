import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const { projectId, instancePin } = await request.json();

    if (!projectId || !instancePin) {
      return NextResponse.json(
          { error: 'projectId and instancePin are required for organizing uploads.'},
          { status: 400}
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    // Cloudinary folder structure
    const cloudinaryFolder = `media/${instancePin}/${projectId}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: cloudinaryFolder,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      folder: cloudinaryFolder,
      postUrl: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: 'Failed to generate upload signature.' }, { status: 500 });
  }
}
