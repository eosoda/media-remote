
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { MediaDisplayComponent } from "@/components/MediaDisplayComponent";
import type { MediaFile, InstanceDisplayState } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Tv2, ShieldAlert, Loader2, WifiOff } from "lucide-react";
import { useAutoHide } from '@/hooks/useAutoHide';

export default function GenericDisplayPage() {
  const {
    isLoading: projectsLoading,
    getOrCreateInstancePin,
    listenToInstanceDisplayState,
    setActiveProjectForMenu,
    getProject,
    activeProjectMedia,
  } = useProjects();

  const [ownInstancePin, setOwnInstancePin] = useState<string | null>(null);
  const [instanceDisplayData, setInstanceDisplayData] = useState<InstanceDisplayState | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [isLoadingPin, setIsLoadingPin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const controlsVisible = useAutoHide(true, 2000);

  useEffect(() => {
    const pin = getOrCreateInstancePin();
    setOwnInstancePin(pin);
    setIsLoadingPin(false);
    document.title = `Display PIN: ${pin} - Media Remote`;
  }, [getOrCreateInstancePin]);

  useEffect(() => {
    if (!ownInstancePin) return;

    setActiveProjectForMenu(null); 

    const unsubscribe = listenToInstanceDisplayState(ownInstancePin, (data) => {
      if (data === undefined) { 
        setInstanceDisplayData(null);
      } else {
        setInstanceDisplayData(data);
      }
      setError(null);
    });

    return () => unsubscribe();
  }, [ownInstancePin, listenToInstanceDisplayState, setActiveProjectForMenu]);

  useEffect(() => {
    if (instanceDisplayData?.currentProjectId) {
      setActiveProjectForMenu(instanceDisplayData.currentProjectId);
    }
  }, [instanceDisplayData?.currentProjectId, setActiveProjectForMenu]);

  const currentProject = useMemo(() => {
    if (projectsLoading || !instanceDisplayData?.currentProjectId) return null;
    return getProject(instanceDisplayData.currentProjectId) || null;
  }, [projectsLoading, instanceDisplayData, getProject]);
  
  useEffect(() => {
    if (activeProjectMedia && instanceDisplayData?.currentMediaId) {
      const mediaToDisplay =
        activeProjectMedia.find(m => m.id === instanceDisplayData.currentMediaId) ||
        activeProjectMedia[0] || 
        null;
      setCurrentMedia(mediaToDisplay);
    } else if (instanceDisplayData && !instanceDisplayData.currentProjectId) {
      setCurrentMedia(null);
    } else if (!instanceDisplayData?.currentMediaId && activeProjectMedia) {
      setCurrentMedia(activeProjectMedia[0] || null);
    }
     else {
      setCurrentMedia(null);
    }

    if (currentProject) {
        document.title = `Display: ${currentProject.name} (PIN: ${ownInstancePin}) - Media Remote`;
    } else if (ownInstancePin) {
        document.title = `Display PIN: ${ownInstancePin} - Media Remote`;
    }

  }, [activeProjectMedia, instanceDisplayData, currentProject, ownInstancePin]);


  if (isLoadingPin || (projectsLoading && !currentProject && instanceDisplayData?.currentProjectId)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {isLoadingPin ? "Initializing display and getting instance PIN..." : "Loading project details..."}
        </p>
        {ownInstancePin && <p className="text-sm text-muted-foreground mt-2">Instance PIN: {ownInstancePin}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive text-center p-4">
        <WifiOff className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Connection Error</h2>
        <p>{error}</p>
        <p className="mt-2 text-sm">Please check your internet connection and Firebase setup.</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }
  
  if (currentProject && ownInstancePin) {
    return (
      <div className={`fixed inset-0 bg-black z-50 ${!controlsVisible ? 'hide-cursor' : ''}`}>
        <MediaDisplayComponent 
            media={currentMedia} 
            projectName={currentProject.name} 
            controlsVisible={controlsVisible}
            defaultDisplayBackground={currentProject.defaultDisplayBackground}
        />
        <div 
          className={`absolute top-2 left-2 bg-black/50 text-white p-2 rounded-md text-xs transition-opacity duration-300 ${controlsVisible ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          Display PIN: {ownInstancePin}
        </div>
        <div 
          className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-300 ${controlsVisible ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/projects/${currentProject.id}`} title="Back to Project Details">
              <ArrowLeft className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Project Details</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-muted text-muted-foreground p-8 text-center">
        {instanceDisplayData?.currentProjectId && !currentProject && !projectsLoading ? (
          <>
            <ShieldAlert className="w-24 h-24 mb-6 opacity-50 text-destructive" />
            <h2 className="text-3xl font-semibold mb-3">Project Not Found</h2>
            <p className="text-lg">The project (ID: {instanceDisplayData.currentProjectId}) selected for display could not be found.</p>
            <p className="text-sm mt-2">It might have been deleted. Waiting for remote to select new media.</p>
            {ownInstancePin && <p className="mt-4 text-sm">Display PIN: <span className="font-semibold">{ownInstancePin}</span></p>}
          </>
        ) : (
          <>
            <Tv2 className="w-24 h-24 mb-6 opacity-30" />
            <h2 className="text-3xl font-semibold mb-3">Display Screen Ready</h2>
            {ownInstancePin ? (
              <p className="text-lg">Use this PIN on a remote device to control this display: <strong className="text-xl font-mono">{ownInstancePin}</strong></p>
            ) : (
              <p className="text-lg">Initializing PIN...</p>
            )}
            <p className="text-sm mt-2">Once connected, the remote can select media to show here.</p>
          </>
        )}
      </div>
    );
  }
}
