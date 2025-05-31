
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileCheck, FileWarning, Loader2, Film } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from 'uuid';
// AI Description related imports removed

const FILE_SIZE = 200;
const MAX_FILE_SIZE = FILE_SIZE * 1024 * 1024; // 200MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

interface MediaUploaderProps {
  projectId: string;
  onUploadComplete?: () => void;
}

interface UploadingFileState {
  id: string; // Unique ID for this upload instance
  file: File;
  progress: number;
  error?: string;
  status: 'pending' | 'generating_thumb' | 'getting_thumb_url' | 'uploading_thumb' | 'getting_url' | 'getting_video_url' | 'uploading' | 'uploading_video' | 'processing_db' | 'complete' | 'error';
  objectKey?: string;
  thumbnailObjectKey?: string;
}

const generateVideoThumbnail = (videoFile: File): Promise<{ thumbnailBlob: Blob, thumbnailFileName: string } | null> => {
  return new Promise((resolve) => {
    if (!videoFile.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2); // Seek to 1s or midpoint
    };

    video.onseeked = () => {
      if (!context) {
        resolve(null);
        return;
      }
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = 300; 
      canvas.height = 300 / aspectRatio;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const extension = videoFile.name.split('.').pop();
          const baseName = videoFile.name.substring(0, videoFile.name.length - (extension ? extension.length + 1 : 0));
          resolve({ thumbnailBlob: blob, thumbnailFileName: `${baseName}_thumb.png` });
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src); 
      }, 'image/png', 0.85); 
    };

    video.onerror = () => {
      console.error("Error loading video for thumbnail generation");
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
    
    video.src = URL.createObjectURL(videoFile);
    video.load(); 
  });
};


export function MediaUploader({ projectId, onUploadComplete }: MediaUploaderProps) {
  const { addMediaToProject, instancePin } = useProjects(); 
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFileState[]>([]);

  const updateUploadState = (id: string, updates: Partial<UploadingFileState>) => {
    setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (typeof instancePin === 'undefined') {
        toast({
          title: "Upload Error",
          description: "Instance PIN not available. Cannot prepare upload.",
          variant: "destructive",
        });
        return;
      }
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejectedFile: any) => {
          rejectedFile.errors.forEach((error: { message: string }) => {
             toast({
                title: `File Error: ${rejectedFile.file.name}`,
                description: error.message,
                variant: "destructive",
              });
          });
        });
      }
      
      const newUploads: UploadingFileState[] = acceptedFiles.map(file => ({ 
        id: uuidv4(), file, progress: 0, status: 'pending' as const 
      }));
      setUploadingFiles(prev => [
        ...prev.filter(f => f.status !== 'complete' && f.status !== 'error'),
        ...newUploads
      ]);

      for (const currentUpload of newUploads) {
        const { file, id: uploadId } = currentUpload;
        let thumbnailObjectKey: string | undefined = undefined;
        let videoObjectKey: string | undefined = undefined;

        try {
          if (file.type.startsWith("video/")) {
            updateUploadState(uploadId, { status: 'generating_thumb', progress: 5 });
            const thumbnailData = await generateVideoThumbnail(file);

            if (thumbnailData) {
              const { thumbnailBlob, thumbnailFileName } = thumbnailData;
              updateUploadState(uploadId, { status: 'getting_thumb_url', progress: 10 });

              const thumbPresignedUrlResponse = await fetch('/api/minio/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  fileName: thumbnailFileName, 
                  fileType: thumbnailBlob.type, 
                  projectId,
                  instancePin
                }),
              });

              if (!thumbPresignedUrlResponse.ok) throw new Error(await thumbPresignedUrlResponse.json().then(e => e.error || 'Failed to get thumbnail upload URL'));
              
              const { presignedUrl: thumbPresignedUrl, objectKey: thumbObjKey, method: thumbMethod } = await thumbPresignedUrlResponse.json();
              thumbnailObjectKey = thumbObjKey;
              updateUploadState(uploadId, { thumbnailObjectKey, progress: 15 });

              updateUploadState(uploadId, { status: 'uploading_thumb', progress: 20 });
              const uploadToMinioThumbResponse = await fetch(thumbPresignedUrl, {
                method: thumbMethod || 'PUT',
                body: thumbnailBlob,
                headers: { 'Content-Type': thumbnailBlob.type },
              });
              if (!uploadToMinioThumbResponse.ok) throw new Error('Failed to upload thumbnail to MinIO');
              updateUploadState(uploadId, { progress: 25 });
            } else {
              console.warn(`Could not generate thumbnail for ${file.name}`);
            }
          }

          const mainFileProgressStart = file.type.startsWith("video/") ? 25 : 10;
          updateUploadState(uploadId, { status: file.type.startsWith("video/") ? 'getting_video_url' : 'getting_url', progress: mainFileProgressStart });
          
          const presignedUrlResponse = await fetch('/api/minio/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fileName: file.name, 
              fileType: file.type,
              projectId,
              instancePin
            }),
          });

          if (!presignedUrlResponse.ok) {
            const errorData = await presignedUrlResponse.json();
            throw new Error(errorData.error || `Failed to get upload URL (status: ${presignedUrlResponse.status})`);
          }
          
          const { presignedUrl, objectKey, method } = await presignedUrlResponse.json();
          videoObjectKey = objectKey;
          
          updateUploadState(uploadId, { objectKey: videoObjectKey, progress: mainFileProgressStart + 15 });
          updateUploadState(uploadId, { status: file.type.startsWith("video/") ? 'uploading_video' : 'uploading', progress: mainFileProgressStart + 20 });
          
          const uploadToMinioResponse = await fetch(presignedUrl, {
            method: method || 'PUT', 
            body: file,
            headers: { 'Content-Type': file.type },
          });

          if (!uploadToMinioResponse.ok) {
             let minioErrorText = await uploadToMinioResponse.text();
             try {
                const xmlError = new DOMParser().parseFromString(minioErrorText, "application/xml");
                const errorMessageNode = xmlError.querySelector("Message");
                if (errorMessageNode) minioErrorText = errorMessageNode.textContent || minioErrorText;
             } catch (e) { /* Ignore parsing error, use raw text */ }
            throw new Error(`Failed to upload to MinIO (status: ${uploadToMinioResponse.status}): ${minioErrorText || uploadToMinioResponse.statusText}`);
          }
          updateUploadState(uploadId, { progress: 85 }); // Adjusted progress assuming no AI step

          updateUploadState(uploadId, { status: 'processing_db', progress: 90 });
          const newMedia = await addMediaToProject(projectId, file, videoObjectKey, thumbnailObjectKey);
          
          if (newMedia) {
            updateUploadState(uploadId, { progress: 100, status: 'complete' });
            toast({
              title: "Upload Successful",
              description: `${file.name} has been uploaded.`,
            });
          } else {
            throw new Error("Failed to add media to project database after upload.");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `Unknown upload error for ${file.name}.`;
          updateUploadState(uploadId, { progress: 100, error: errorMessage, status: 'error' });
          toast({
            title: "Upload Failed",
            description: `Could not upload ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
      }
      if (onUploadComplete) onUploadComplete();
      
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.status === 'error'));
      }, 5000);
    },
    [projectId, instancePin, addMediaToProject, toast, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const getStatusText = (status: UploadingFileState['status']): string => {
    switch (status) {
      case 'pending': return 'Pending...';
      case 'generating_thumb': return 'Generating thumbnail...';
      case 'getting_thumb_url': return 'Preparing thumbnail upload...';
      case 'uploading_thumb': return 'Uploading thumbnail...';
      case 'getting_url': return 'Preparing upload...';
      case 'getting_video_url': return 'Preparing video upload...';
      case 'uploading': return 'Uploading to storage...';
      case 'uploading_video': return 'Uploading video to storage...';
      // Removed 'generating_description'
      case 'processing_db': return 'Saving to database...';
      case 'complete': return 'Complete!';
      case 'error': return 'Error';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-6 w-6 text-primary"/> Upload Media</CardTitle>
        <CardDescription>
          Drag & drop images (JPG, PNG, GIF, WebP) or videos (MP4, WebM) here, or click to select files. Max <span className="font-semibold">{FILE_SIZE}MB</span> per file. Video thumbnails will be generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors
            ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-primary">Drop the files here ...</p>
          ) : (
            <p className="text-muted-foreground">Drag &apos;n&apos; drop files here, or click to select files</p>
          )}
        </div>
        {uploadingFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadingFiles.map(({ id, file, progress, error, status }) => (
              <div key={id} className="p-2 border rounded-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate max-w-[60%] font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{getStatusText(status)}</span>
                  {status === 'error' && <FileWarning className="h-5 w-5 text-destructive ml-2" />}
                  {status === 'complete' && <FileCheck className="h-5 w-5 text-green-500 ml-2" />}
                  {![ 'complete', 'error', 'pending'].includes(status) && 
                    !error && <Loader2 className="h-5 w-5 animate-spin text-primary ml-2" />}
                </div>
                <Progress value={progress} className={`h-2 ${status === 'error' ? 'bg-destructive/30 [&>div]:bg-destructive' : ''}`} />
                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

