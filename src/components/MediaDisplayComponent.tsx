
"use client";

import type { MediaFile } from "@/types";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Maximize, Minimize, AlertTriangle, Play, Pause, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";

interface MediaDisplayComponentProps {
  media: MediaFile | null;
  projectName?: string;
  controlsVisible?: boolean;
  defaultDisplayBackground?: string;
}

export function MediaDisplayComponent({ media, projectName, controlsVisible, defaultDisplayBackground }: MediaDisplayComponentProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to true to help autoplay

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      if (videoElement) { // Check if videoElement is still valid
        setIsMuted(videoElement.muted);
      }
    };

    if (media?.type === 'video' && videoElement) {
      videoElement.currentTime = 0;
      // Autoplay will respect the `muted={isMuted}` prop on the <video> tag.
      // Since isMuted state now defaults to true, autoplay is more likely to succeed.
      const playPromise = videoElement.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Autoplay started successfully.
          // The 'play' event listener will call setIsPlaying(true).
        }).catch(error => {
          // Autoplay was prevented. This is often logged by the browser console too.
          console.error("Autoplay prevented for video:", media.name, error);
          // The 'pause' event listener (if video ends up paused) will call setIsPlaying(false).
        });
      }

      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('volumechange', handleVolumeChange);

      // Initial sync of React states with the actual video element state
      // This is important because the play() attempt might change these.
      setIsMuted(videoElement.muted);
      setIsPlaying(!videoElement.paused);

      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('volumechange', handleVolumeChange);
      };
    } else {
      // Media is not a video, or videoElement is not available
      setIsPlaying(false); // No video-specific playback state
      if (videoElement) { // If there was a video previously, ensure listeners are cleaned up
         videoElement.removeEventListener('play', handlePlay);
         videoElement.removeEventListener('pause', handlePause);
         videoElement.removeEventListener('volumechange', handleVolumeChange);
      }
    }
  }, [media]); // Key dependency: the media object itself


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

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      // The 'volumechange' event, handled in useEffect, will update the isMuted React state.
    }
  };
  
  let containerBaseClasses = "relative w-full h-full flex flex-col items-center justify-center overflow-hidden";
  let backgroundStyle: React.CSSProperties = {};
  
  if (defaultDisplayBackground) {
    if (defaultDisplayBackground.match(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/) ||
        defaultDisplayBackground.match(/^(rgb|rgba|hsl|hsla)\(/) ||
        (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('color', defaultDisplayBackground))) {
      backgroundStyle.backgroundColor = defaultDisplayBackground;
    } 
    else if (defaultDisplayBackground.startsWith('http') || defaultDisplayBackground.startsWith('/') || defaultDisplayBackground.startsWith('data:image')) {
      backgroundStyle.backgroundImage = `url('${defaultDisplayBackground}')`;
      backgroundStyle.backgroundSize = 'cover';
      backgroundStyle.backgroundPosition = 'center';
    } else {
      // Fallback if defaultDisplayBackground is invalid, but media exists
      if (media) containerBaseClasses += " bg-black"; else containerBaseClasses += " bg-muted";
    }
  } else {
    // No defaultDisplayBackground provided
    if (media) containerBaseClasses += " bg-black"; else containerBaseClasses += " bg-muted";
  }


  return (
    <div className={containerBaseClasses} style={backgroundStyle}>
      {media ? (
        media.type === "image" ? (
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
            ref={videoRef}
            src={media.url}
            autoPlay // autoPlay attribute is a hint, programmatic play is more reliable
            loop
            muted={isMuted} // Controlled by React state, now defaults to true
            className="max-w-full max-h-full object-contain"
            // Event listeners for play/pause/ended are handled in useEffect
          />
        )
      ) : (
        null 
      )}

      {media && (
         <div 
          className={`absolute top-4 left-4 bg-black/50 text-white p-2 rounded-md transition-opacity duration-300 ${controlsVisible ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
         >
          <p className="text-sm font-medium truncate max-w-xs" title={media.name}>{media.name}</p>
          {projectName && <p className="text-xs opacity-80">Project: {projectName}</p>}
        </div>
      )}

      {media?.type === 'video' && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/50 p-2 rounded-lg shadow-md transition-opacity duration-300 ${controlsVisible ? 'opacity-80 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <Button onClick={handlePlayPause} variant="ghost" size="icon" className="text-white hover:bg-white/20" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button onClick={handleStop} variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Stop">
            <Square className="h-5 w-5" />
          </Button>
          <Button onClick={handleToggleMute} variant="ghost" size="icon" className="text-white hover:bg-white/20" title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button onClick={toggleFullscreen} variant="ghost" size="icon" className="text-white hover:bg-white/20" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      )}
      {media?.type === 'image' && (
         <div 
           className={`absolute bottom-4 right-4 transition-opacity duration-300 ${controlsVisible ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
         >
          <Button onClick={toggleFullscreen} variant="secondary" size="icon" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <Minimize /> : <Maximize />}
          </Button>
        </div>
      )}
    </div>
  );
}

  