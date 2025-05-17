
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileCheck, FileWarning, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MediaUploaderProps {
  projectId: string;
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

interface UploadingFileState {
  file: File;
  progress: number;
  error?: string;
  status: 'pending' | 'getting_url' | 'uploading' | 'processing_db' | 'complete' | 'error';
  objectKey?: string;
}

export function MediaUploader({ projectId, onUploadComplete }: MediaUploaderProps) {
  const { addMediaToProject, instancePin } = useProjects(); 
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFileState[]>([]);

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
        rejectedFiles.forEach((rejectedFile: any) => { // Type rejectedFile as any for now based on useDropzone type
          rejectedFile.errors.forEach((error: { message: string }) => { // Type error as { message: string }
             toast({
                title: `File Error: ${rejectedFile.file.name}`, // Access file name safely
                description: error.message,
                variant: "destructive",
              });
          });
        });
      }
      
      const newUploads = acceptedFiles.map(file => ({ file, progress: 0, status: 'pending' as const }));
      setUploadingFiles(prev => [
        ...prev.filter(f => f.status !== 'complete' && f.status !== 'error'),
        ...newUploads
      ]);

      for (let i = 0; i < newUploads.length; i++) {
        const currentUpload = newUploads[i];
        const { file } = currentUpload;

        try {
          // 1. Get presigned URL from our API
          setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, status: 'getting_url' as const, progress: 10} : f));
          
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
          console.log(`Received presigned URL for ${file.name}: ${presignedUrl}, Method: ${method}, ObjectKey: ${objectKey}`); // Log the presigned URL
          setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, progress: 25, objectKey } : f));

          // 2. Upload file to MinIO using the presigned URL
          setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, status: 'uploading' as const, progress: 30} : f));
          
          const uploadToMinioResponse = await fetch(presignedUrl, {
            method: method || 'PUT', // Use method from API response, default to PUT
            body: file,
            headers: { 'Content-Type': file.type },
          });

          if (!uploadToMinioResponse.ok) {
             let minioErrorText = await uploadToMinioResponse.text();
             try {
                const xmlError = new DOMParser().parseFromString(minioErrorText, "application/xml");
                const errorMessageNode = xmlError.querySelector("Message");
                if (errorMessageNode) {
                    minioErrorText = errorMessageNode.textContent || minioErrorText;
                }
             } catch (e) { /* Ignore parsing error, use raw text */ }

            throw new Error(`Failed to upload to MinIO (status: ${uploadToMinioResponse.status}): ${minioErrorText || uploadToMinioResponse.statusText}`);
          }
          setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, progress: 75} : f));
          
          // 3. Add media metadata to Firestore via ProjectContext
          setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, status: 'processing_db' as const} : f));
          const newMedia = await addMediaToProject(projectId, file, objectKey);
          
          if (newMedia) {
            setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, progress: 100, status: 'complete' as const} : f));
            toast({
              title: "Upload Successful",
              description: `${file.name} has been uploaded.`,
            });
          } else {
            throw new Error("Failed to add media to project database after upload.");
          }
        } catch (error) {
          console.error("Upload failed for", file.name, error);
          const errorMessage = error instanceof Error ? error.message : `Unknown upload error for ${file.name}.`;
          setUploadingFiles(prev => prev.map(f => f.file === file ? {...f, progress: 100, error: errorMessage, status: 'error' as const} : f));
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
      case 'getting_url': return 'Preparing upload...';
      case 'uploading': return 'Uploading to storage...';
      case 'processing_db': return 'Saving to database...';
      case 'complete': return 'Complete!';
      case 'error': return 'Error';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-6 w-6 text-primary"/> Upload Media to MinIO</CardTitle>
        <CardDescription>
          Drag & drop images (JPG, PNG, GIF, WebP) or videos (MP4, WebM) here, or click to select files. Max 50MB per file.
          Files will be uploaded to your configured MinIO instance.
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
            {uploadingFiles.map(({ file, progress, error, status }, index) => (
              <div key={`${file.name}-${index}`} className="p-2 border rounded-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate max-w-[60%] font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{getStatusText(status)}</span>
                  {status === 'error' && <FileWarning className="h-5 w-5 text-destructive ml-2" />}
                  {status === 'complete' && <FileCheck className="h-5 w-5 text-green-500 ml-2" />}
                  {(status === 'pending' || status === 'getting_url' || status === 'uploading' || status === 'processing_db') && 
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
