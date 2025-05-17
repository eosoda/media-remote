
"use client";

import type { Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, Loader2 } from "lucide-react"; 
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { ProjectItemCard } from "./ProjectItemCard"; // Import the new component

interface ProjectListProps {
  projectsToDisplay: Project[]; 
  listContext?: "instance" | "admin" | "remote"; 
}

export function ProjectList({ projectsToDisplay, listContext = "instance" }: ProjectListProps) {
  const { isLoading, deleteProject, setActiveProjectForMenu, instancePin } = useProjects();
  const { toast } = useToast();
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  let cardTitle = "Projects";
  let cardDescription = "Manage your media projects.";

  if (listContext === "instance") {
    cardTitle = "Projects for This Instance";
    cardDescription = `Listing projects associated with this device (PIN: ${instancePin || "..."}).`;
  } else if (listContext === "admin") {
    cardTitle = "All Projects (Admin View)";
    cardDescription = "Manage all projects across all instances.";
  }

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
      });
      console.error("Failed to delete project:", error);
    } finally {
      setDeletingProjectId(null);
    }
  }, [deleteProject, toast]);

  if (isLoading && listContext !== 'remote' && projectsToDisplay.length === 0) { 
    return (
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
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
        <CardHeader>
          <CardTitle>No Projects Found</CardTitle>
          <CardDescription>
            {listContext === "instance" 
              ? `No projects found for this device instance (PIN: ${instancePin || "..."}). Use the form to create one.`
              : listContext === "admin" 
                ? "There are no projects in the system yet."
                : "No projects available for the selected PIN."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="py-10">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {listContext === "instance" && (
             <p className="text-sm text-muted-foreground">
                Use the "Create New Project" form to begin.
             </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-320px)] pr-4">
          <div className="space-y-4">
            {projectsToDisplay.map((project) => (
              <ProjectItemCard
                key={project.id}
                project={project}
                listContext={listContext}
                onDeleteProject={handleDeleteProject}
                setActiveProjectForMenu={setActiveProjectForMenu}
                isDeletingThisProject={deletingProjectId === project.id}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
