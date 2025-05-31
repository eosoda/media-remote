
"use client";

import { useProjects } from "@/contexts/ProjectContext";
import { PlayCircle, Loader2, Image as ImageIcon, Video as VideoIcon, List, CheckSquare, ListTree, ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useMemo, useEffect } from "react";
import { MediaItemCard } from "./MediaItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaFile, Project } from "@/types";

interface MediaGalleryProps {
  project?: Project;
  onMediaSelect?: (mediaId: string) => void;
  externallyControlledMediaId?: string | null;
  interactive?: boolean;
  showSetCurrent?: boolean;
}

export function MediaGallery({
  onMediaSelect,
  externallyControlledMediaId,
  project: projectProp,
  interactive: interactiveProp,
  showSetCurrent: showSetCurrentProp
}: MediaGalleryProps) {
  const {
    activeProjectForMenu: activeProjectFromContext,
    activeProjectMedia: mediaForActiveProjectFromContext,
    deleteMedia,
    setCurrentMediaForProject,
    updateMediaOrder,
  } = useProjects();
  const { toast } = useToast();
  const [isDeletingMediaId, setIsDeletingMediaId] = useState<string | null>(null);
  const [isSettingActiveMediaId, setIsSettingActiveMediaId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "image" | "video">("all");
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(false);

  const currentProjectToDisplay = useMemo(() => projectProp || activeProjectFromContext, [projectProp, activeProjectFromContext]);

  const allMediaForCurrentProject = useMemo(() => {
    if (projectProp && projectProp.media) { // Check if projectProp.media is defined
        return projectProp.media;
    }
    return mediaForActiveProjectFromContext || [];
  }, [projectProp, mediaForActiveProjectFromContext]);


  const [displayedMediaItems, setDisplayedMediaItems] = useState<MediaFile[]>([]);

  useEffect(() => {
    setDisplayedMediaItems(allMediaForCurrentProject);
  }, [allMediaForCurrentProject]);

  const hasImagesInProject = useMemo(() => allMediaForCurrentProject?.some(media => media.type === "image") || false, [allMediaForCurrentProject]);
  const hasVideosInProject = useMemo(() => allMediaForCurrentProject?.some(media => media.type === "video") || false, [allMediaForCurrentProject]);

  useEffect(() => {
    if (activeFilter === "image" && !hasImagesInProject && allMediaForCurrentProject.length > 0) {
      setActiveFilter("all");
    }
    if (activeFilter === "video" && !hasVideosInProject && allMediaForCurrentProject.length > 0) {
      setActiveFilter("all");
    }
  }, [hasImagesInProject, hasVideosInProject, activeFilter, allMediaForCurrentProject.length]);

  const handleDeleteMedia = useCallback(async (mediaId: string, mediaName: string) => {
    const projectId = currentProjectToDisplay?.id;
    if (!projectId) return;
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
  }, [deleteMedia, toast, currentProjectToDisplay?.id]);

  const handleSetCurrentMedia = useCallback(async (mediaId: string) => {
    const projectId = currentProjectToDisplay?.id;
    if (!projectId) return;
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
  }, [setCurrentMediaForProject, toast, currentProjectToDisplay?.id]);

  const filteredMediaForDisplayMemo = useMemo(() => {
    if (!displayedMediaItems) return [];
    if (activeFilter === "all") {
      return displayedMediaItems;
    }
    return displayedMediaItems.filter(media => media.type === activeFilter);
  }, [displayedMediaItems, activeFilter]);


  const handleMove = useCallback(async (mediaId: string, direction: 'up' | 'down') => {
    if (!currentProjectToDisplay?.id || activeFilter !== 'all') return;

    setDisplayedMediaItems(prevItems => {
      const items = [...prevItems]; // Operate on a mutable copy for local state update
      const currentIndex = items.findIndex(item => item.id === mediaId);
      if (currentIndex === -1) return prevItems; // Should not happen

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= items.length) return prevItems; // Already at top or bottom

      // Swap items
      [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];
      
      // Update order property for all items
      const updatedItemsWithOrder = items.map((item, index) => ({
        ...item,
        order: index,
      }));

      // Persist the new order to Firestore
      updateMediaOrder(currentProjectToDisplay.id, updatedItemsWithOrder)
        .then(() => {
          toast({
            title: "Media Reordered",
            description: "The media order has been updated.",
          });
        })
        .catch((error) => {
          toast({
            title: "Error Reordering Media",
            description: "Could not update media order. Please try again.",
            variant: "destructive",
          });
          // Potentially revert to `allMediaForCurrentProject` if persistence fails
        });
      
      return updatedItemsWithOrder; // Optimistic UI update
    });
  }, [currentProjectToDisplay?.id, activeFilter, updateMediaOrder, toast]);


  const interactive = interactiveProp !== undefined ? interactiveProp : !!currentProjectToDisplay;
  const showSetCurrentEffective = showSetCurrentProp !== undefined ? showSetCurrentProp : !onMediaSelect;
  const isGalleryOrderingActive = isOrderingEnabled && activeFilter === 'all';

  const getPlaceholderMessage = () => {
    if (!allMediaForCurrentProject || allMediaForCurrentProject.length === 0) {
      return "No media files in this project yet. Upload some images or videos to get started.";
    }
    if (activeFilter === "image" && !filteredMediaForDisplayMemo.some(m => m.type === 'image')) return "No images found in this project.";
    if (activeFilter === "video" && !filteredMediaForDisplayMemo.some(m => m.type === 'video')) return "No videos found in this project.";
    if (filteredMediaForDisplayMemo.length === 0 && (allMediaForCurrentProject.some(m => m.type === 'image') || allMediaForCurrentProject.some(m => m.type === 'video'))) return "No media files found matching the current filter.";
    if (filteredMediaForDisplayMemo.length === 0) return "No media files in this project yet.";
    return "Error determining placeholder.";
  };

  const getPlaceholderIcon = () => {
    if (!allMediaForCurrentProject || allMediaForCurrentProject.length === 0) {
      return <PlayCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />;
    }
    if (activeFilter === "image" && !filteredMediaForDisplayMemo.some(m => m.type === 'image')) return <ImageIcon className="mx-auto h-16 w-16 mb-4 opacity-50" />;
    if (activeFilter === "video" && !filteredMediaForDisplayMemo.some(m => m.type === 'video')) return <VideoIcon className="mx-auto h-16 w-16 mb-4 opacity-50" />;
    if (filteredMediaForDisplayMemo.length === 0) return <PlayCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />;
    return <PlayCircle className="mx-auto h-16 w-16 mb-4 opacity-50" />;
  };

  let numVisibleTabs = 1; 
  if (hasImagesInProject) numVisibleTabs++;
  if (hasVideosInProject) numVisibleTabs++;
  
  let tabsListColsClass = "grid-cols-1";
  if (numVisibleTabs === 2) tabsListColsClass = "grid-cols-2";
  else if (numVisibleTabs === 3) tabsListColsClass = "grid-cols-3";


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "image" | "video")} className="">
          <TabsList className={`grid ${tabsListColsClass} md:w-[300px]`}>
            <TabsTrigger value="all"><List className="mr-2 h-4 w-4"/>All</TabsTrigger>
            {hasImagesInProject && <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4"/>Images</TabsTrigger>}
            {hasVideosInProject && <TabsTrigger value="video"><VideoIcon className="mr-2 h-4 w-4"/>Videos</TabsTrigger>}
          </TabsList>
        </Tabs>
        {interactive && (allMediaForCurrentProject && allMediaForCurrentProject.length >=2 ) && (
            <Button
              variant="outline"
              onClick={() => {
                if (activeFilter !== 'all' && !isOrderingEnabled) {
                  toast({ description: "Reordering is only available on the 'All' tab. Please switch to 'All' to enable reordering." });
                  return;
                }
                setIsOrderingEnabled(prev => !prev);
              }}
              title={isOrderingEnabled ? "Disable Reordering (View Mode)" : "Enable Reordering (Order Mode)"}
              disabled={ (activeFilter !== 'all' && !isOrderingEnabled) || allMediaForCurrentProject.length < 2 } 
            >
            {isGalleryOrderingActive ? <CheckSquare className="mr-2 h-4 w-4 text-green-600" /> : <ListTree className="mr-2 h-4 w-4" />}
            {isGalleryOrderingActive ? "Reordering Active" : "Reorder Media"}
            </Button>
        )}
      </div>
      {activeFilter !== 'all' && isOrderingEnabled && (
        <div className="mb-2 p-2 text-sm bg-amber-100 text-amber-700 border border-amber-200 rounded-md">
          Reordering is only available when the &quot;All&quot; filter is selected. Please switch to the &quot;All&quot; tab to reorder media.
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-380px)] lg:h-[calc(100vh-300px)] pr-1">
          <div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1"
          >
            {filteredMediaForDisplayMemo.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {getPlaceholderIcon()}
                  <p className="text-lg">{getPlaceholderMessage()}</p>
                </div>
              ) : (
              filteredMediaForDisplayMemo.map((media: MediaFile, index: number) => {
                const isMediaEffectivelyActive = externallyControlledMediaId !== undefined
                  ? externallyControlledMediaId === media.id
                  : currentProjectToDisplay?.currentMediaId === media.id;
                
                return (
                  <MediaItemCard
                    key={media.id}
                    media={media}
                    isEffectivelyActive={isMediaEffectivelyActive}
                    interactive={interactive}
                    onMediaSelect={onMediaSelect}
                    showSetCurrent={showSetCurrentEffective}
                    onDeleteMedia={handleDeleteMedia}
                    onSetCurrentMedia={handleSetCurrentMedia}
                    isDeletingThisMedia={isDeletingMediaId === media.id}
                    isSettingThisMediaActive={isSettingActiveMediaId === media.id}
                    isOrderingActive={isGalleryOrderingActive}
                    index={index}
                    listLength={filteredMediaForDisplayMemo.length}
                    onMoveUp={() => handleMove(media.id, 'up')}
                    onMoveDown={() => handleMove(media.id, 'down')}
                  />
                );
              })
            )}
          </div>
      </ScrollArea>
    </div>
  );
}
