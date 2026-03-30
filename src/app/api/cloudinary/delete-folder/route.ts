import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json({ error: 'folderPath is required.' }, { status: 400 });
    }

    // Step 1: Delete all resources within the folder
    // Cloudinary requires folders to be empty before deletion.
    const resourceDeletionResult = await cloudinary.api.delete_resources_by_prefix(folderPath);

    // Step 2: Delete the folder itself
    const folderDeletionResult = await cloudinary.api.delete_folder(folderPath);

    return NextResponse.json({ 
      success: true, 
      resourceResult: resourceDeletionResult,
      folderResult: folderDeletionResult
    });
  } catch (error) {
    console.error('Cloudinary folder deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete folder and contents.' }, { status: 500 });
  }
}
