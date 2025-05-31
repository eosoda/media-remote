
"use client";

import type { Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader, CardTitle, CardDescription
import { Folder, Loader2 } from "lucide-react"; 
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { ProjectItemCard } from "./ProjectItemCard";
import { ProjectSettingsModal } from "./ProjectSettingsModal"; // Import the modal

interface ProjectListProps {
  projectsToDisplay: Project[]; 
  listContext?: "instance" | "admin" | "remote"; 
}

export function ProjectList({ projectsToDisplay, listContext = "instance" }: ProjectListProps) {
  const { isLoading, deleteProject, setActiveProjectForMenu, instancePin } = useProjects();
  const { toast } = useToast();
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null); // State for modal

  const handleDeleteProject = useCallback(async (projectId: string, projectName: string) => {
    setDeletingProjectId(projectId);
    try {
      await deleteProject(projectId);
      toast({
        title: "Project Deleted",
        description: `Project "${projectName}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error Deleting Project",
        description: `Failed to delete "${projectName}". Please try again.`,
        variant: "destructive",
      });;
    } finally {
      setDeletingProjectId(null);
    }
  }, [deleteProject, toast]);

  const handleOpenSettingsModal = (project: Project) => {
    setEditingProject(project);
  };

  const handleCloseSettingsModal = () => {
    setEditingProject(null);
  };

  if (isLoading && listContext !== 'remote' && projectsToDisplay.length === 0) { 
    return (
      <Card>
        {/* CardHeader removed */}
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
          <p>Loading projects...</p>
        </CardContent>
      </Card>
    );
  }

  if (projectsToDisplay.length === 0) {
    return (
      <Card className="text-center">
        {/* CardHeader removed */}
        <CardContent className="py-10">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
           <p className="text-lg mb-2">No Projects Found</p>
          <p className="text-sm text-muted-foreground">
            {listContext === "instance" 
              ? `No projects found for this device instance (PIN: ${instancePin || "..."}). Create one to get started.`
              : listContext === "admin" 
                ? "There are no projects in the system yet."
                : "No projects available for the selected PIN."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {/* CardHeader removed */}
        <CardContent className="pt-4"> {/* Adjusted padding-top since header is removed */}
          <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-250px)] pr-4"> {/* Adjusted height calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projectsToDisplay.map((project) => (
                <ProjectItemCard
                  key={project.id}
                  project={project}
                  listContext={listContext}
                  onDeleteProject={handleDeleteProject}
                  setActiveProjectForMenu={setActiveProjectForMenu}
                  isDeletingThisProject={deletingProjectId === project.id}
                  onOpenSettings={handleOpenSettingsModal} // Pass handler to card
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {editingProject && (
        <ProjectSettingsModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={handleCloseSettingsModal}
        />
      )}
    </>
  );
}
