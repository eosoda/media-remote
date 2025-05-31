
"use client"; 

import { CreateProjectForm } from "@/components/CreateProjectForm";
import { ProjectList } from "@/components/ProjectList";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/contexts/ProjectContext";
import { FolderKanban, Loader2, PlusCircle } from "lucide-react";

function ProjectsOverviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { instancePin, isLoading: projectsContextLoading, instanceProjects, setActiveProjectForMenu } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    setActiveProjectForMenu(null); // Clear active project for menu on this page
    document.title = "My Projects - Media Remote";
    if (searchParams.get("create") === "true") {
      setShowCreateDialog(true);
    }
  }, [searchParams, setActiveProjectForMenu]);

  const handleProjectCreated = (projectId: string) => {
    setShowCreateDialog(false);
    // Clear the "create=true" query param if it was set
    const newPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.delete('create');
    const search = params.toString();
    const finalPath = search ? `${newPath}?${search}` : newPath;
    window.history.replaceState({...window.history.state, as: finalPath, url: finalPath }, '', finalPath);
    // router.push(`/projects/${projectId}`); // Removed this line to prevent redirection
  }

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    // Clear the "create=true" query param
    const newPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.delete('create');
    const search = params.toString();
    const finalPath = search ? `${newPath}?${search}` : newPath;
    window.history.replaceState({...window.history.state, as: finalPath, url: finalPath }, '', finalPath);
  }

  return (
    <div className="space-y-8"> 
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FolderKanban className="mr-3 h-8 w-8 text-primary" />
            My Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage projects for this device instance (PIN: <span className="font-semibold">{instancePin || "Loading..."}</span>).
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Project
        </Button>
      </div>

      <div>
        {projectsContextLoading && !instancePin ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <p>Loading projects and instance PIN...</p>
            </div>
        ) : (
          <ProjectList projectsToDisplay={instanceProjects} listContext="instance" />
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          } else {
            setShowCreateDialog(true);
          }
        }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new project. Projects are linked to this device instance (PIN: {instancePin || "..."}).
            </DialogDescription>
          </DialogHeader>
          <CreateProjectForm onProjectCreated={handleProjectCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsOverviewPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full flex-1 items-center justify-center py-10">
        <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Projects Overview...</p>
      </div>
    }>
      <ProjectsOverviewContent />
    </Suspense>
  );
}

