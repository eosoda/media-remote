"use client";

import type { MediaFile, Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Trash2, PlayCircle, Eye, CheckCircle2, Loader2 } from "lucide-react"; // Added Loader2
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useState } from "react"; 

interface MediaGalleryProps {
  project: Project;
  onMediaSelect?: (mediaId: string) => void;
  interactive?: boolean; 
  showSetCurrent?: boolean; 
  externallyControlledMediaId?: string | null; // New prop
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


  const handleDeleteMedia = async (mediaId: string, mediaName: string) => {
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
  };

  const handleSetCurrentMedia = async (mediaId: string) => {
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
  };

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
          // Determine if media is active. Prioritize externallyControlledMediaId if provided.
          const isMediaEffectivelyActive = externallyControlledMediaId !== undefined 
            ? externallyControlledMediaId === media.id
            : project.currentMediaId === media.id;

          return (
            <Card 
              key={media.id} 
              className={`overflow-hidden transition-all duration-200 ease-in-out shadow-md hover:shadow-xl ${interactive ? 'cursor-pointer hover:scale-105' : ''} ${isMediaEffectivelyActive ? 'ring-2 ring-primary' : ''}`}
              onClick={() => interactive && onMediaSelect && onMediaSelect(media.id)}
            >
              <CardHeader className="p-0 relative">
                {media.type === "image" ? (
                  <Image
                    src={media.url}
                    alt={media.name}
                    width={300}
                    height={200}
                    className="aspect-video w-full object-cover"
                    data-ai-hint="gallery thumbnail"
                  />
                ) : (
                  <div className="aspect-video w-full bg-black flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white opacity-70" />
                  </div>
                )}
                {isMediaEffectivelyActive && (
                  <Badge variant="default" className="absolute top-2 right-2 bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1"/> Active
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-3 space-y-1">
                <CardTitle className="text-sm font-medium truncate" title={media.name}>{media.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {media.type === "image" ? "Image" : "Video"} - {(media.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </CardContent>
              <CardFooter className="p-3 flex justify-between items-center">
                {/* "Set Active" button only makes sense if not remotely controlling & showSetCurrent is true */}
                {showSetCurrent && externallyControlledMediaId === undefined && (
                  isMediaEffectivelyActive ? (
                    <Button variant="default" size="sm" disabled>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Active
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); handleSetCurrentMedia(media.id); }}
                      disabled={isSettingActiveMediaId === media.id}
                    >
                      {isSettingActiveMediaId === media.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />} 
                      Set Active
                    </Button>
                  )
                )}
                
                {/* Spacer if no "Set Active" button is shown but delete button is there */}
                {/* This ensures the delete button is pushed to the right if "Set Active" isn't there */}
                {!(showSetCurrent && externallyControlledMediaId === undefined) && !interactive && <div className="flex-grow"/>}

                {!interactive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10" 
                        onClick={(e) => e.stopPropagation()}
                        disabled={isDeletingMediaId === media.id}
                      >
                        {isDeletingMediaId === media.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Media File?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{media.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {e.stopPropagation(); handleDeleteMedia(media.id, media.name)}} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeletingMediaId === media.id}
                        >
                           {isDeletingMediaId === media.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  );
}
