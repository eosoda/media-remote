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
import { useProjects } from "@/contexts/ProjectContext";
import { FolderKanban, Loader2 } from "lucide-react";

function ProjectsOverviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { instancePin, isLoading: projectsContextLoading, instanceProjects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateDialog(true);
    }
  }, [searchParams]);

  const handleProjectCreated = (projectId: string) => {
    setShowCreateDialog(false);
    // Clear the "create=true" query param
    const newPath = window.location.pathname;
    window.history.replaceState({...window.history.state, as: newPath, url: newPath }, '', newPath);
    router.push(`/projects/${projectId}`);
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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <FolderKanban className="mr-3 h-8 w-8 text-primary" />
          My Projects
        </h1>
        <p className="text-muted-foreground">
          Manage projects for this device instance (PIN: <span className="font-semibold">{instancePin || "Loading..."}</span>).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
            <CreateProjectForm
              onProjectCreated={(id) => router.push(`/projects/${id}`)}
              className="sticky top-6"
            />
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          {projectsContextLoading && !instancePin ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                <p>Loading projects and instance PIN...</p>
              </div>
          ) : (
            <ProjectList projectsToDisplay={instanceProjects} listContext="instance" />
          )}
        </div>
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
              Enter a name for your new project. Click create when you're done.
              It will be associated with this device (PIN: {instancePin || "..."}).
            </DialogDescription>
          </DialogHeader>
          <CreateProjectForm onProjectCreated={handleProjectCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsOverviewPage() {
  const { setActiveProjectForMenu } = useProjects();

  useEffect(() => {
    setActiveProjectForMenu(null);
  }, [setActiveProjectForMenu]);

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
