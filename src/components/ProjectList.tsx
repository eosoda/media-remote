
"use client";

import Link from "next/link";
import type { Project } from "@/types"; // Import Project type
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Trash2, Eye, Loader2 } from "lucide-react"; 
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ProjectListProps {
  projectsToDisplay: Project[]; // Receives already filtered or all projects
  listContext?: "instance" | "admin" | "remote"; // To tailor descriptions
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
  } else if (listContext === "remote") {
     // Description might be set by the parent component for remote context
  }


  if (isLoading && listContext !== 'remote') { // Remote might pass projects before global loading is done
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

  const handleDeleteProject = async (projectId: string, projectName: string) => {
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
  };

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
              <Card key={project.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-card p-4 gap-2 border-b">
                  <div className="flex-grow overflow-hidden">
                    <Link href={`/projects/${project.id}`} onClick={() => setActiveProjectForMenu(project.id)}>
                      <CardTitle className="text-lg font-semibold hover:text-primary transition-colors flex items-center truncate">
                        <Folder className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                        <span className="truncate" title={project.name}>{project.name}</span>
                      </CardTitle>
                    </Link>
                    {listContext === "admin" && project.instancePin && ( // Show PIN in admin view
                        <p className="text-xs text-muted-foreground mt-1">Instance PIN: {project.instancePin}</p>
                    )}
                  </div>
                  {/* Delete button only shown if not in 'remote' context */}
                  {listContext !== 'remote' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                          disabled={deletingProjectId === project.id}
                          title="Delete Project"
                        >
                          {deletingProjectId === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          <span className="sr-only">Delete Project</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>{`This action cannot be undone. This will permanently delete the project "${project.name}" and all its media.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteProject(project.id, project.name)} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deletingProjectId === project.id}
                          >
                            {deletingProjectId === project.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {project.media.length} media file{project.media.length !== 1 && "s"}.
                    Created on: {project.createdAt instanceof Date ? project.createdAt.toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild onClick={() => setActiveProjectForMenu(project.id)}>
                      <Link href={`/projects/${project.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Manage Media
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
