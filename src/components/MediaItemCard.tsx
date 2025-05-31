
"use client";

import React, { useState } from 'react'; // Added useState
import type { MediaFile } from "@/types";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { 
  Trash2, Eye, CheckCircle2, Loader2, Film, Image as ImageIcon, ArrowUp, ArrowDown, MoreVertical,
  GripVertical 
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import type { DraggableProvided } from 'react-beautiful-dnd';

interface MediaItemCardProps {
  media: MediaFile;
  isEffectivelyActive: boolean;
  interactive: boolean;
  showSetCurrent: boolean; 
  onMediaSelect?: (mediaId: string) => void; 
  onDeleteMedia: (mediaId: string, mediaName: string) => Promise<void>;
  onSetCurrentMedia: (mediaId: string) => Promise<void>; 
  isDeletingThisMedia: boolean;
  isSettingThisMediaActive: boolean;
  
  isOrderingActive: boolean;
  index: number;
  listLength: number;
  onMoveUp: (mediaId: string) => void;
  onMoveDown: (mediaId: string) => void;
  
  className?: string;
  draggableProvided?: DraggableProvided; 
}

const MediaItemCardComponent = React.forwardRef<HTMLDivElement, MediaItemCardProps>(
  ({
    media,
    isEffectivelyActive,
    interactive,
    showSetCurrent,
    onMediaSelect,
    onDeleteMedia,
    onSetCurrentMedia,
    isDeletingThisMedia,
    isSettingThisMediaActive,
    isOrderingActive,
    index,
    listLength,
    onMoveUp,
    onMoveDown,
    className,
    draggableProvided,
    ...restProps 
  }, ref) => {

    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for context menu

    const displayThumbnail = media.type === 'video' && media.thumbnailUrl ? media.thumbnailUrl : media.type === 'image' ? media.url : null;

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isOrderingActive) {
        e.stopPropagation(); 
        return;
      }
      if (onMediaSelect) { 
        onMediaSelect(media.id);
      } else if (showSetCurrent && onSetCurrentMedia && !isEffectivelyActive) { 
        onSetCurrentMedia(media.id);
      }
    };

    const handleMoveUpClick = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      onMoveUp(media.id);
    };

    const handleMoveDownClick = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      onMoveDown(media.id);
    };
    
    const canShowMoreOptionsMenu = interactive && !onMediaSelect && !isOrderingActive;

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      if (canShowMoreOptionsMenu) {
        setIsMenuOpen(true);
      }
    };

    return (
      <div
        ref={draggableProvided ? draggableProvided.innerRef : ref}
        {...(draggableProvided ? draggableProvided.draggableProps : {})}
        {...(isOrderingActive && draggableProvided ? draggableProvided.dragHandleProps : {})}
        className={cn(
          "group relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-md bg-card text-card-foreground transition-all duration-200 ease-in-out",
          isEffectivelyActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:shadow-xl',
          (interactive && !isOrderingActive) ? 'cursor-pointer' : (isOrderingActive ? 'cursor-grab' : 'default'),
          className
        )}
        onClick={isOrderingActive ? undefined : handleCardClick}
        onContextMenu={handleContextMenu} // Added context menu handler
        style={{ ...(draggableProvided ? draggableProvided.draggableProps.style : {}) }}
        {...restProps}
      >
        {displayThumbnail ? (
          <Image
            src={displayThumbnail}
            alt={media.name}
            fill
            className="object-cover"
            priority={isEffectivelyActive}
            draggable="false" 
            onDragStart={(e) => e.preventDefault()}
            data-ai-hint={media.type === 'video' ? "video thumbnail" : "gallery image"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {media.type === "video" ? (
              <Film className="h-16 w-16 text-muted-foreground opacity-70" />
            ) : (
              <ImageIcon className="h-16 w-16 text-muted-foreground opacity-70" />
            )}
          </div>
        )}

        {isEffectivelyActive && (
          <Badge variant="default" className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground shadow-md !py-0.5 !px-1.5">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            <span className="text-xs">Active</span>
          </Badge>
        )}

        {interactive && isOrderingActive && (
          <div 
            className="absolute top-1 left-1 z-20 flex flex-col space-y-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 shadow-md bg-black/40 hover:bg-black/60 text-white border-white/30"
              onClick={handleMoveUpClick}
              disabled={index === 0}
              title="Move Up"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 shadow-md bg-black/40 hover:bg-black/60 text-white border-white/30"
              onClick={handleMoveDownClick}
              disabled={index === listLength - 1}
              title="Move Down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div 
            className={cn(
                "absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1 bg-black/60 p-2 text-white backdrop-blur-sm",
                "transition-opacity duration-200",
                 (isOrderingActive || isEffectivelyActive) ? "opacity-100" : "group-hover:opacity-100 md:opacity-0",
            )}
        >
            <div className="flex items-center gap-1.5 overflow-hidden">
              {media.type === "image" ? (
                <ImageIcon className="h-4 w-4 text-gray-300 flex-shrink-0" />
              ) : (
                <Film className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <h3 className="truncate text-xs font-semibold" title={media.name}>{media.name}</h3>
            </div>

            {canShowMoreOptionsMenu && (
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-200 hover:bg-gray-700 hover:text-white flex-shrink-0"
                    title="More options"
                    disabled={isSettingThisMediaActive || isDeletingThisMedia || isOrderingActive}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  onClick={(e) => e.stopPropagation()}
                  // Radix automatically handles closing on escape and pointer down outside
                >
                  {showSetCurrent && !isEffectivelyActive && (
                    <DropdownMenuItem
                      onClick={() => onSetCurrentMedia(media.id)}
                      disabled={isSettingThisMediaActive}
                    >
                      {isSettingThisMediaActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                      Set Active
                    </DropdownMenuItem>
                  )}
                  {showSetCurrent && isEffectivelyActive && (
                     <DropdownMenuItem disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Currently Active
                    </DropdownMenuItem>
                  )}
                  {showSetCurrent && <DropdownMenuSeparator />}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onSelect={(e) => {
                            e.preventDefault(); // Important: Prevents DropdownMenu from closing before AlertDialog opens
                        }}
                        disabled={isDeletingThisMedia}
                      >
                        {isDeletingThisMedia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Media
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Media File?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{media.name}"? This action cannot be undone.
                          {media.type === 'video' && media.thumbnailUrl && " Its thumbnail will also be deleted."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteMedia(media.id, media.name)}
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={isDeletingThisMedia}
                        >
                          {isDeletingThisMedia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </div>
    );
  }
);

MediaItemCardComponent.displayName = "MediaItemCardComponent";

export const MediaItemCard = React.memo(MediaItemCardComponent);

