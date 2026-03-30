
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

        try {
          updateUploadState(uploadId, { status: 'getting_url', progress: 10 });
          
          const signatureResponse = await fetch('/api/cloudinary/signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, instancePin }),
          });

          if (!signatureResponse.ok) {
            const errorData = await signatureResponse.json();
            throw new Error(errorData.error || `Failed to get upload signature`);
          }
          
          const { signature, timestamp, apiKey, folder, postUrl } = await signatureResponse.json();
          
          updateUploadState(uploadId, { status: file.type.startsWith("video/") ? 'uploading_video' : 'uploading', progress: 30 });
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);
          formData.append('folder', folder);
          
          const uploadResponse = await fetch(postUrl, {
            method: 'POST', 
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
          }

          const uploadResult = await uploadResponse.json();
          const publicId = uploadResult.public_id;
          const secureUrl = uploadResult.secure_url;
          
          let thumbnailUrl = undefined;
          let thumbnailPublicId = undefined;

          if (file.type.startsWith("video/")) {
             thumbnailUrl = secureUrl.replace(/\.(mp4|webm)$/i, '.jpg');
             thumbnailPublicId = publicId;
          }

          updateUploadState(uploadId, { objectKey: publicId, thumbnailObjectKey: thumbnailPublicId, progress: 85 });

          updateUploadState(uploadId, { status: 'processing_db', progress: 90 });
          const newMedia = await addMediaToProject(projectId, file, secureUrl, publicId, thumbnailUrl, thumbnailPublicId);
          
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

