import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

async function deleteFolderSubfoldersRecursive(folderPath: string) {
  try {
    let subFoldersResult: any;
    try {
      subFoldersResult = await cloudinary.api.sub_folders(folderPath);
    } catch (error: any) {
      // If folder doesn't exist, it throws 404, which is fine
      if (error.http_code === 404) {
        return;
      }
      throw error;
    }

    if (subFoldersResult && subFoldersResult.folders) {
      for (const subFolder of subFoldersResult.folders) {
        // Recursively go down
        await deleteFolderSubfoldersRecursive(subFolder.path);
      }
    }

    try {
      await cloudinary.api.delete_folder(folderPath);
    } catch (error: any) {
      if (error.http_code !== 404) {
        throw error;
      }
    }
  } catch (error) {
    console.error(`Error deleting folder ${folderPath} recursively:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json({ error: 'folderPath is required.' }, { status: 400 });
    }

    // Step 1: Delete all resources within the folder
    // delete_resources_by_prefix deletes everything in this folder and sub-folders.
    const resourceDeletionResult = await cloudinary.api.delete_resources_by_prefix(folderPath);

    // Step 2: Delete the folder and any sub-folders from the bottom up
    await deleteFolderSubfoldersRecursive(folderPath);

    return NextResponse.json({ 
      success: true, 
      resourceResult: resourceDeletionResult,
      folderResult: 'Folders recursively deleted'
    });
  } catch (error) {
    console.error('Cloudinary folder deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete folder and contents.' }, { status: 500 });
  }
}
