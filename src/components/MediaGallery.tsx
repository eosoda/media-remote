
"use client";

import { useProjects } from "@/contexts/ProjectContext";
import { PlayCircle, Loader2 } from "lucide-react"; 
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react"; 
import { MediaItemCard } from "./MediaItemCard";

interface MediaGalleryProps {
  onMediaSelect?: (mediaId: string) => void;
  interactive?: boolean;
  showSetCurrent?: boolean;
  externallyControlledMediaId?: string | null;
}

export function MediaGallery({ 
  onMediaSelect,
  externallyControlledMediaId 
}: MediaGalleryProps) {
  const { deleteMedia, setCurrentMediaForProject, activeProjectMedia, activeProjectForMenu } = useProjects();
  const { toast } = useToast();
  const [isDeletingMediaId, setIsDeletingMediaId] = useState<string | null>(null);
  const [isSettingActiveMediaId, setIsSettingActiveMediaId] = useState<string | null>(null);

  const handleDeleteMedia = useCallback(async (mediaId: string, mediaName: string) => {
    // Need the project ID to delete media - get it from the active project
    const projectId = activeProjectForMenu?.id;
    if (!projectId) return; // Should not happen if called from a project's gallery
    setIsDeletingMediaId(mediaId);

    try {
 await deleteMedia(projectId, mediaId);
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
    } finally {
      setIsDeletingMediaId(null);
    }
  }, [deleteMedia, toast, activeProjectForMenu?.id]); // Depend on activeProjectForMenu?.id

  const handleSetCurrentMedia = useCallback(async (mediaId: string) => {
    // Need the project ID to set current media - get it from the active project
    const projectId = activeProjectForMenu?.id;
    if (!projectId) return; // Should not happen if called from a project's gallery
    setIsSettingActiveMediaId(mediaId);

    try {
 await setCurrentMediaForProject(projectId, mediaId);
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
    } finally {
      setIsSettingActiveMediaId(null);
    }
  }, [setCurrentMediaForProject, toast, activeProjectForMenu?.id]); // Depend on activeProjectForMenu?.id

  // Determine interaction based on whether a project is selected
  const interactive = !activeProjectForMenu ? false : true; // Assuming gallery is interactive only if a project is selected
  const showSetCurrent = activeProjectForMenu ? true : false; // Assuming "Set Current" is shown only if a project is selected


  if (!activeProjectForMenu) {
    return (
      <div className="text-center py-8 text-muted-foreground">
         <p className="text-lg">Select a project to view media.</p>
      </div>
    );
  }

  if (activeProjectMedia.length === 0) {
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
        {activeProjectMedia.map((media) => {
          const isMediaEffectivelyActive = externallyControlledMediaId !== undefined 
            ? externallyControlledMediaId === media.id
            : activeProjectForMenu.currentMediaId === media.id;

          return (
            <MediaItemCard
              key={media.id}
              media={media}
              projectId={activeProjectForMenu.id} // Pass the ID of the active project
              isEffectivelyActive={false} // Always set to false to remove active highlight
              interactive={interactive}
              onMediaSelect={onMediaSelect}
              showSetCurrent={false} // Always set to false to remove the button
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
