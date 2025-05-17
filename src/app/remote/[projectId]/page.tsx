
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useProjects } from "@/contexts/ProjectContext";
import { MediaGallery } from "@/components/MediaGallery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tv2, AlertTriangle, Loader2 } from "lucide-react"; // Added Loader2
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstanceDisplayState } from "@/types";

export default function RemoteControlPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { getProject, isLoading, updateDisplayForInstance, setActiveProjectForMenu, listenToInstanceDisplayState } = useProjects();
  const projectId = params.projectId as string;
  const targetInstancePin = searchParams.get("instancePin"); 

  const project = getProject(projectId);
  const [instanceControlledMediaId, setInstanceControlledMediaId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  useEffect(() => {
    if (project) {
      setActiveProjectForMenu(project.id);
    }
  }, [project, setActiveProjectForMenu]);

  useEffect(() => {
    if (isLoading) { // isLoading from useProjects
        setIsPageLoading(true);
        return;
    }
    setIsPageLoading(false);

    if (!targetInstancePin) {
      router.replace('/remote/select-project');
    }
  }, [isLoading, targetInstancePin, router]);

  useEffect(() => {
    if (!targetInstancePin) return;

    const unsubscribe = listenToInstanceDisplayState(targetInstancePin, (data: InstanceDisplayState | null) => {
      // Only update if the project ID matches, or if no project is set on the instance
      if (data?.currentProjectId === projectId || !data?.currentProjectId) {
        setInstanceControlledMediaId(data?.currentMediaId || null);
      } else if (data?.currentProjectId && data.currentProjectId !== projectId) {
        // If instance is displaying another project, this remote shouldn't highlight anything from current project
        setInstanceControlledMediaId(null); 
      }
    });

    return () => unsubscribe();
  }, [targetInstancePin, projectId, listenToInstanceDisplayState]);


  if (isPageLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading remote control...</p>
        </div>
    );
  }

  if (!targetInstancePin) {
     return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Display Instance PIN Missing</h1>
        <p className="text-muted-foreground mb-6">
          The PIN for the target display instance was not provided.
        </p>
        <Button asChild variant="outline">
          <Link href="/remote/select-project">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to PIN Entry
          </Link>
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-6">Cannot open remote control as the project (ID: {projectId}) was not found.</p>
        <Button asChild variant="outline">
          <Link href={`/remote/select-project?instancePin=${targetInstancePin || ''}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Select Another Project
          </Link>
        </Button>
      </div>
    );
  }

  const handleMediaSelect = (mediaId: string) => {
    if (targetInstancePin) {
      updateDisplayForInstance(targetInstancePin, project.id, mediaId);
      // The listener will update instanceControlledMediaId, triggering re-render of MediaGallery
    } else {
        alert("Error: Target Display PIN is missing. Please re-enter the PIN.");
        router.push('/remote/select-project');
    }
  };

  return (
    <div className="container mx-auto py-8">

       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href={`/remote/select-project?instancePin=${targetInstancePin}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project Selection
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Remote: {project.name}</h1>
          <p className="text-muted-foreground">Controlling display for PIN: <span className="font-semibold">{targetInstancePin}</span>. Select media to display.</p>
        </div>
        <Button asChild>
          <Link href="/display" target="_blank" rel="noopener noreferrer"> 
            <Tv2 className="mr-2 h-4 w-4" /> Open This Browser's Display
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Select Media to Display</CardTitle>
            <CardDescription>Click on a media item to make it active on the display page associated with PIN &quot;{targetInstancePin}&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
            <MediaGallery 
              project={project} 
              onMediaSelect={handleMediaSelect} 
              interactive={true} 
              externallyControlledMediaId={instanceControlledMediaId}
            />
        </CardContent>
      </Card>
    </div>
  );
}

