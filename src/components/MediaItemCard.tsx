
"use client";

import React from 'react';
import type { MediaFile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Trash2, PlayCircle, Eye, CheckCircle2, Loader2 } from "lucide-react";
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

interface MediaItemCardProps {
  projectId: string;
  media: MediaFile;
  isEffectivelyActive: boolean;
  interactive: boolean;
  showSetCurrent: boolean;
  onMediaSelect?: (mediaId: string) => void;
  onDeleteMedia: (mediaId: string, mediaName: string) => Promise<void>;
  onSetCurrentMedia: (mediaId: string) => Promise<void>;
  isDeletingThisMedia: boolean;
  isSettingThisMediaActive: boolean;
}

const MediaItemCardComponent: React.FC<MediaItemCardProps> = ({
  media,
  isEffectivelyActive,
  interactive,
  showSetCurrent,
  onMediaSelect,
  onDeleteMedia,
  onSetCurrentMedia,
  isDeletingThisMedia,
  isSettingThisMediaActive,
}) => {
  return (
    <Card
      key={media.id}
      className={`overflow-hidden transition-all duration-200 ease-in-out shadow-md hover:shadow-xl ${interactive ? 'cursor-pointer hover:scale-105' : ''} ${isEffectivelyActive ? 'ring-2 ring-primary' : ''}`}
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
            priority={isEffectivelyActive} // Prioritize loading active image
          />
        ) : (
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-white opacity-70" />
          </div>
        )}
        {isEffectivelyActive && (
          <Badge variant="default" className="absolute top-2 right-2 bg-primary text-primary-foreground">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Active
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
        {showSetCurrent && (
          isEffectivelyActive ? (
            <Button variant="default" size="sm" disabled>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Active
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onSetCurrentMedia(media.id); }}
              disabled={isSettingThisMediaActive}
            >
              {isSettingThisMediaActive ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />}
              Set Active
            </Button>
          )
        )}

        {!(showSetCurrent) && interactive && <div className="flex-grow" />}

        {interactive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={(e) => e.stopPropagation()}
                disabled={isDeletingThisMedia}
                title="Delete Media"
              >
                {isDeletingThisMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                  onClick={(e) => { e.stopPropagation(); onDeleteMedia(media.id, media.name); }}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isDeletingThisMedia}
                >
                  {isDeletingThisMedia ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
};

export const MediaItemCard = React.memo(MediaItemCardComponent);
