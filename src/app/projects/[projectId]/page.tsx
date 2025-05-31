
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjects } from "@/contexts/ProjectContext";
import { MediaUploader } from "@/components/MediaUploader";
import { MediaGallery } from "@/components/MediaGallery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tv2, Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectSettingsModal } from "@/components/ProjectSettingsModal"; // Import the modal
import type { Project } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getProject, isLoading, setActiveProjectForMenu } = useProjects();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const currentProject = getProject(projectId);
    setProject(currentProject || null);

    if (currentProject) {
      setActiveProjectForMenu(currentProject.id);
      document.title = `Project: ${currentProject.name} - Media Remote`;
    } else if (!isLoading) {
      document.title = `Project Not Found - Media Remote`;
      // Optionally redirect if project is definitely not found after loading
      // router.push('/projects-overview'); 
    }
  }, [projectId, getProject, isLoading, setActiveProjectForMenu, router]);


  if (isLoading && !project) { // Show loading only if project isn't set yet
    return <div className="flex justify-center items-center h-screen"><p>Loading project details...</p></div>;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-6">The project you are looking for (ID: {projectId}) does not exist or could not be loaded.</p>
        <Button asChild variant="outline">
          <Link href="/projects-overview">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Projects Overview
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-2 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link href="/projects-overview">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <span className="text-sm font-mono">
              Instance PIN for this project's media: {project.instancePin}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
              <Settings className="mr-2 h-4 w-4" /> Project Settings
            </Button>
            <Button asChild>
              <Link href={`/display/${project.id}`} target="_blank" rel="noopener noreferrer">
                <Tv2 className="mr-2 h-4 w-4" /> Open Display
              </Link>
            </Button>
          </div>
        </div>

        <MediaUploader projectId={project.id} />
        
        <Card>
          <CardHeader>
              <CardTitle>Media Gallery</CardTitle>
              <CardDescription>View and manage uploaded media files for "{project.name}". Click on a media item to set it as the current one for display.</CardDescription>
          </CardHeader>
          <CardContent>
              <MediaGallery project={project} showSetCurrent={true} />
          </CardContent>
        </Card>
      </div>
      
      {project && (
        <ProjectSettingsModal
          project={project}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
}
