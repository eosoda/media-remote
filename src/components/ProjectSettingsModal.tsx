
"use client";

import { useEffect, useState, useCallback } from "react";
import type { Project } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import NextImage from "next/image";
import { useProjects } from "@/contexts/ProjectContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const projectSettingsFormSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Project name is too long"),
});

type ProjectSettingsFormValues = z.infer<typeof projectSettingsFormSchema>;

const MAX_BACKGROUND_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface ProjectSettingsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({ project, isOpen, onClose }: ProjectSettingsModalProps) {
  const { updateProjectSettings, instancePin } = useProjects();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  const [currentUploadedBgPath, setCurrentUploadedBgPath] = useState<string | null | undefined>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  const form = useForm<ProjectSettingsFormValues>({
    resolver: zodResolver(projectSettingsFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (project && isOpen) {
      form.reset({
        name: project.name,
      });
      setBackgroundImagePreview(project.defaultDisplayBackgroundStoragePath ? project.defaultDisplayBackground || null : null);
      setCurrentUploadedBgPath(project.defaultDisplayBackgroundStoragePath);
      setBackgroundImageFile(null); 
    } else if (!isOpen) {
      form.reset({ name: "" });
      setBackgroundImageFile(null);
      setBackgroundImagePreview(null);
      setCurrentUploadedBgPath(null);
      setIsSubmitting(false);
      setIsUploadingBackground(false);
    }
  }, [project, isOpen, form]);

  const onBackgroundImageDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejectedFile: any) => {
        rejectedFile.errors.forEach((error: { message: string }) => {
          toast({
            title: `Background Image Error: ${rejectedFile.file.name}`,
            description: error.message,
            variant: "destructive",
          });
        });
      });
      return;
    }
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setBackgroundImageFile(file);
      setBackgroundImagePreview(URL.createObjectURL(file));
    }
  }, [toast]);

  const { getRootProps: getBgRootProps, getInputProps: getBgInputProps, isDragActive: isBgDragActive } = useDropzone({
    onDrop: onBackgroundImageDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: MAX_BACKGROUND_IMAGE_SIZE,
    multiple: false,
  });

  const handleRemoveUploadedBackground = () => {
    setBackgroundImageFile(null);
    setBackgroundImagePreview(null);
    setCurrentUploadedBgPath(null); 
    toast({ description: "Uploaded background image will be removed on save." });
  };

  const onSubmit = async (data: ProjectSettingsFormValues) => {
    if (!project) return;
    setIsSubmitting(true);
    setIsUploadingBackground(false);

    let newBackgroundUrl: string | null = null;
    let newBackgroundStoragePath: string | null = null;

    if (backgroundImageFile) { 
      setIsUploadingBackground(true);
      try {
        const signatureResponse = await fetch('/api/cloudinary/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id, instancePin: project.instancePin }),
        });

        if (!signatureResponse.ok) {
          const errorData = await signatureResponse.json();
          throw new Error(errorData.error || 'Failed to get upload signature.');
        }

        const { signature, timestamp, apiKey, folder, postUrl } = await signatureResponse.json();

        const formData = new FormData();
        formData.append('file', backgroundImageFile);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadResponse = await fetch(postUrl, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload background image to Cloudinary.');
        }

        const uploadResult = await uploadResponse.json();
        newBackgroundUrl = uploadResult.secure_url;
        newBackgroundStoragePath = uploadResult.public_id;

      } catch (error) {
        toast({
          title: "Background Upload Error",
          description: (error instanceof Error && error.message) || "Could not upload background image.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsUploadingBackground(false);
        return;
      }
      setIsUploadingBackground(false);
    } else if (currentUploadedBgPath === null && project.defaultDisplayBackgroundStoragePath) {
      newBackgroundUrl = null;
      newBackgroundStoragePath = null; 
    } else if (project.defaultDisplayBackgroundStoragePath && !backgroundImageFile) {
      newBackgroundUrl = project.defaultDisplayBackground || null;
      newBackgroundStoragePath = project.defaultDisplayBackgroundStoragePath || null;
    }

    try {
      await updateProjectSettings(project.id, {
        name: data.name,
        defaultDisplayBackground: newBackgroundUrl,
        defaultDisplayBackgroundStoragePath: newBackgroundStoragePath,
      });
      toast({
        title: "Settings Saved",
        description: `Project "${data.name}" settings have been updated.`,
      });
      if (backgroundImageFile) {
        setBackgroundImageFile(null); 
      }
      onClose(); 
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: (error instanceof Error && error.message) || "Failed to save project settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings for &quot;{project.name}&quot;</DialogTitle>
          <DialogDescription>Update the name and default display background image for your project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name-modal">Project Name</Label>
            <Input
              id="name-modal"
              {...form.register("name")}
              className="mt-1"
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bg-upload-modal">Default Display Background Image</Label>
            {!backgroundImagePreview && (
              <>
                <p className="text-xs text-muted-foreground">
                  Upload an image to set as the background when no media is active.
                </p>
                <div
                  {...getBgRootProps()}
                  className={`mt-1 p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors
                    ${isBgDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
                    ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input {...getBgInputProps()} id="bg-upload-modal" disabled={isSubmitting} />
                  {isUploadingBackground ? (
                      <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p>Uploading background...</p>
                      </div>
                  ): isBgDragActive ? (
                    <p className="text-primary">Drop the image here...</p>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Drag & drop or click to upload background</p>
                      <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, GIF, WebP</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {backgroundImagePreview && (
              <div className="space-y-2">
                  <Label>Background Preview:</Label>
                  <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
                      {backgroundImagePreview ? (
                           <NextImage src={backgroundImagePreview} alt="Background preview" layout="fill" objectFit="contain" data-ai-hint="abstract background"/>
                      ) : null }
                      {(backgroundImageFile || currentUploadedBgPath) && ( 
                           <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 z-10 h-7 w-7"
                              onClick={handleRemoveUploadedBackground}
                              disabled={isSubmitting || isUploadingBackground}
                              title="Remove uploaded background"
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      )}
                  </div>
                  {backgroundImageFile && <p className="text-xs text-muted-foreground">New upload: {backgroundImageFile.name}</p>}
                   {!backgroundImageFile && currentUploadedBgPath && project.defaultDisplayBackground && <p className="text-xs text-muted-foreground">Current: {project.defaultDisplayBackground.split('/').pop()}</p>}
              </div>
          )}

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting || isUploadingBackground}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || isUploadingBackground}>
              {isSubmitting || isUploadingBackground ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    