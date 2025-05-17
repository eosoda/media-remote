
"use client";

import type { Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { PlayCircle, Loader2 } from "lucide-react"; 
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react"; 
import { MediaItemCard } from "./MediaItemCard"; // Import the new component

interface MediaGalleryProps {
  project: Project;
  onMediaSelect?: (mediaId: string) => void;
  interactive?: boolean; 
  showSetCurrent?: boolean; 
  externallyControlledMediaId?: string | null;
}

export function MediaGallery({ 
  project, 
  onMediaSelect, 
  interactive = false, 
  showSetCurrent = false, 
  externallyControlledMediaId 
}: MediaGalleryProps) {
  const { deleteMedia, setCurrentMediaForProject } = useProjects();
  const { toast } = useToast();
  const [isDeletingMediaId, setIsDeletingMediaId] = useState<string | null>(null);
  const [isSettingActiveMediaId, setIsSettingActiveMediaId] = useState<string | null>(null);

  const handleDeleteMedia = useCallback(async (mediaId: string, mediaName: string) => {
    setIsDeletingMediaId(mediaId);
    try {
      await deleteMedia(project.id, mediaId); 
      toast({
        title: "Media Deleted",
        description: `Media file "${mediaName}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error Deleting Media",
        description: `Could not delete media "${mediaName}". Please try again.`,
        variant: "destructive",
      });
      console.error("Error deleting media:", error);
    } finally {
      setIsDeletingMediaId(null);
    }
  }, [deleteMedia, project.id, toast]);

  const handleSetCurrentMedia = useCallback(async (mediaId: string) => {
    setIsSettingActiveMediaId(mediaId);
    try {
      await setCurrentMediaForProject(project.id, mediaId); 
      toast({
        title: "Media Activated",
        description: `Media has been set as active for display within this project.`,
      });
    } catch (error) {
       toast({
        title: "Error Activating Media",
        description: `Could not set media as active. Please try again.`,
        variant: "destructive",
      });
      console.error("Error setting current media:", error);
    } finally {
      setIsSettingActiveMediaId(null);
    }
  }, [setCurrentMediaForProject, project.id, toast]);

  if (project.media.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <PlayCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg">No media files in this project yet.</p>
        <p>Upload some images or videos to get started.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)] lg:h-[calc(100vh-200px)] pr-1">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1">
        {project.media.map((media) => {
          const isMediaEffectivelyActive = externallyControlledMediaId !== undefined 
            ? externallyControlledMediaId === media.id
            : project.currentMediaId === media.id;

          return (
            <MediaItemCard
              key={media.id}
              media={media}
              projectId={project.id}
              isEffectivelyActive={isMediaEffectivelyActive}
              interactive={interactive}
              onMediaSelect={onMediaSelect}
              showSetCurrent={showSetCurrent && externallyControlledMediaId === undefined}
              onDeleteMedia={handleDeleteMedia}
              onSetCurrentMedia={handleSetCurrentMedia}
              isDeletingThisMedia={isDeletingMediaId === media.id}
              isSettingThisMediaActive={isSettingActiveMediaId === media.id}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
