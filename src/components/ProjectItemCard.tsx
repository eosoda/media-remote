
"use client";

import React from 'react';
import Link from "next/link";
import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Trash2, Eye, Loader2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

interface ProjectItemCardProps {
  project: Project;
  listContext: "instance" | "admin" | "remote";
  onDeleteProject: (projectId: string, projectName: string) => Promise<void>;
  setActiveProjectForMenu: (projectId: string | null) => void;
  isDeletingThisProject: boolean;
}

const ProjectItemCardComponent: React.FC<ProjectItemCardProps> = ({
  project,
  listContext,
  onDeleteProject,
  setActiveProjectForMenu,
  isDeletingThisProject,
}) => {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-card p-4 gap-2 border-b">
        <div className="flex-grow overflow-hidden">
          <Link href={`/projects/${project.id}`} onClick={() => setActiveProjectForMenu(project.id)}>
            <CardTitle className="text-lg font-semibold hover:text-primary transition-colors flex items-center truncate">
              <Folder className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate" title={project.name}>{project.name}</span>
            </CardTitle>
          </Link>
          {listContext === "admin" && project.instancePin && (
            <p className="text-xs text-muted-foreground mt-1">Instance PIN: {project.instancePin}</p>
          )}
        </div>
        {listContext !== 'remote' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                disabled={isDeletingThisProject}
                title="Delete Project"
              >
                {isDeletingThisProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                  onClick={() => onDeleteProject(project.id, project.name)}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isDeletingThisProject}
                >
                  {isDeletingThisProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
  );
};

export const ProjectItemCard = React.memo(ProjectItemCardComponent);
