
"use client";

import type { MediaFile } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Maximize, Minimize, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface MediaDisplayComponentProps {
  media: MediaFile | null;
  projectName?: string;
  controlsVisible?: boolean;
}

export function MediaDisplayComponent({ media, projectName, controlsVisible }: MediaDisplayComponentProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  if (!media) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-muted text-muted-foreground p-8 text-center">
        <AlertTriangle className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-semibold mb-2">No Media Selected</h2>
        <p>There is no media currently selected for display in project &quot;{projectName || 'N/A'}&quot;.</p>
        <p>Please select media using the remote control or project management page.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">
      {media.type === "image" ? (
        <Image
          src={media.url}
          alt={media.name}
          fill
          className="object-contain"
          priority
          data-ai-hint="displayed image"
        />
      ) : (
        <video
          src={media.url}
          controls
          autoPlay
          loop
          className="max-w-full max-h-full object-contain"
        />
      )}
      <div 
        className={`absolute bottom-4 right-4 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Button onClick={toggleFullscreen} variant="secondary" size="icon" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>
      </div>
       <div 
        className={`absolute top-4 left-4 bg-black/50 text-white p-2 rounded-md transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
       >
        <p className="text-sm font-medium truncate max-w-xs" title={media.name}>{media.name}</p>
        {projectName && <p className="text-xs opacity-80">Project: {projectName}</p>}
      </div>
    </div>
  );
}
