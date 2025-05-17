
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProjects } from "@/contexts/ProjectContext";
import { MediaDisplayComponent } from "@/components/MediaDisplayComponent";
import type { MediaFile } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAutoHide } from '@/hooks/useAutoHide';
export default function ProjectSpecificDisplayPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { getProject, isLoading, setActiveProjectForMenu } = useProjects();
  
  const project = getProject(projectId); 
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const controlsVisible = useAutoHide(true, 2000);

  useEffect(() => {
    if (isLoading) return;

    if (project) {
      setActiveProjectForMenu(project.id);
      const mediaToDisplay = 
        project.media.find(m => m.id === project.currentMediaId) || 
        project.media[0] || 
        null;
      setCurrentMedia(mediaToDisplay);
    } else {
      setCurrentMedia(null);
    }
  }, [project, isLoading, setActiveProjectForMenu, projectId]);


  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2"/>
        <p>Loading display for project...</p>
      </div>
    );
  }

  if (!project) { 
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-6">Cannot display media as the project (ID: {projectId}) was not found.</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Projects
          </Link>
        </Button>
      </div>
    );
  }
  
  return ( 
    <div className={`fixed inset-0 bg-black z-50 ${!controlsVisible ? 'hide-cursor' : ''}`}>
      <MediaDisplayComponent media={currentMedia} projectName={project.name} controlsVisible={controlsVisible} />
      <div 
        className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-300 ${controlsVisible ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Link back to the project management page, not the generic display or remote selection */}
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/projects/${project.id}`} title="Back to Project Details">
            <ArrowLeft className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Project Details</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
