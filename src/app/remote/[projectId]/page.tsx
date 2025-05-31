
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/contexts/ProjectContext";
import { MediaGallery } from "@/components/MediaGallery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tv2, AlertTriangle, Loader2, Smartphone, Info } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstanceDisplayState } from "@/types";

export default function RemoteControlPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getProject, isLoading, updateDisplayForInstance, setActiveProjectForMenu, listenToInstanceDisplayState, getOrCreateInstancePin } = useProjects();
  const projectId = params.projectId as string;
  const targetInstancePin = searchParams.get("instancePin");

  const project = getProject(projectId);
  const [instanceControlledMediaId, setInstanceControlledMediaId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [thisDevicePin, setThisDevicePin] = useState<string | null>(null);

  useEffect(() => {
    setThisDevicePin(getOrCreateInstancePin());
  }, [getOrCreateInstancePin]);

  useEffect(() => {
    if (project) {
      setActiveProjectForMenu(project.id);
      document.title = `Remote: ${project.name} - Media Remote`;
    } else if (!isLoading) {
      document.title = `Remote: Project Not Found - Media Remote`;
    }
  }, [project, isLoading, setActiveProjectForMenu, projectId]);

  useEffect(() => {
    if (isLoading) {
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
      if (data?.currentProjectId === projectId || !data?.currentProjectId) {
        setInstanceControlledMediaId(data?.currentMediaId || null);
      } else if (data?.currentProjectId && data.currentProjectId !== projectId) {
        setInstanceControlledMediaId(null);
      }
    });

    return () => unsubscribe();
  }, [targetInstancePin, projectId, listenToInstanceDisplayState]);

  const handleClearActiveMediaForRemote = async () => {
    if (targetInstancePin && project) {
      try {
        await updateDisplayForInstance(targetInstancePin, project.id, null);
        // Toast for success/failure can be handled within MediaGallery or here
      } catch (error) {
        console.error("Failed to clear active media for remote:", error);
         // Optionally show a toast here if not handled by MediaGallery
      }
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading remote control...</p>
      </div>
    );
  }

  if (!targetInstancePin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-6">Cannot open remote control as the project (ID: {projectId}) was not found for PIN {targetInstancePin}.</p>
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
    } else {
      alert("Error: Target Display PIN is missing. Please re-enter the PIN.");
      router.push('/remote/select-project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-1 -ml-2">
            <Link href={`/remote/select-project?instancePin=${targetInstancePin}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project Selection
            </Link>
          </Button>
          <div className="flex items-center space-x-3">
            <Smartphone className="h-8 w-8 text-primary flex-shrink-0" />
            <h1 className="text-3xl font-bold tracking-tight truncate" title={project.name}>
              Remote: {project.name}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Controlling display with PIN: <span className="font-semibold text-foreground">{targetInstancePin}</span>. Select media to display.
          </p>
        </div>
        
      </div>

      <Card className="w-full">
        <CardContent className="pt-4">
          <MediaGallery
            project={project}
            onMediaSelect={handleMediaSelect}
            interactive={true}
            externallyControlledMediaId={instanceControlledMediaId}
            showSetCurrent={false}
            allowReordering={false}
            onClearActiveMedia={handleClearActiveMediaForRemote}
            isAnyMediaActive={!!instanceControlledMediaId}
          />
        </CardContent>
      </Card>

      {thisDevicePin !== targetInstancePin && (
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Info className="h-6 w-6 text-primary"/>
            <div>
              <CardTitle className="text-lg">Using a Different Display?</CardTitle>
              <CardDescription>
                You are controlling PIN <span className="font-semibold">{targetInstancePin}</span>.
                If you want to control this browser&apos;s display (PIN: {thisDevicePin || "Loading..."}),
                you need to enter <Link href={`/remote/select-project?instancePin=${thisDevicePin || ""}`} className="underline hover:text-primary">this device&apos;s PIN ({thisDevicePin || "..."})</Link> on the selection page.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
