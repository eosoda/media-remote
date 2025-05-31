
"use client";

import React, { useState } from 'react';
import Link from "next/link";
import type { Project } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Trash2, Settings, ArrowRight, Loader2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface ProjectItemCardProps {
  project: Project;
  listContext: "instance" | "admin" | "remote";
  onDeleteProject: (projectId: string, projectName: string) => Promise<void>;
  setActiveProjectForMenu: (projectId: string | null) => void;
  isDeletingThisProject: boolean;
  onOpenSettings: (project: Project) => void;
}

const ProjectItemCardComponent: React.FC<ProjectItemCardProps> = ({
  project,
  listContext,
  onDeleteProject,
  setActiveProjectForMenu,
  isDeletingThisProject,
  onOpenSettings,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for the dropdown menu

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (listContext !== 'remote') { // Only show context menu if actions are available
      setIsMenuOpen(true);
    }
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-200 ease-in-out",
        isDeletingThisProject ? "opacity-50 pointer-events-none" : ""
      )}
      onContextMenu={handleContextMenu} // Add context menu handler
    >
      <CardHeader className="flex-row items-start justify-between pb-3">
        <div className="flex-1 overflow-hidden">
          <CardTitle className="text-lg font-semibold text-foreground truncate flex items-center" title={project.name}>
            <Folder className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{project.name}</span>
          </CardTitle>
        </div>
        {listContext !== 'remote' && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 flex-shrink-0 -mr-2 -mt-1"
                disabled={isDeletingThisProject}
                title="More actions"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent any parent link or handler
                  // setIsMenuOpen(!isMenuOpen); // Handled by onOpenChange
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()} 
            >
              <DropdownMenuItem onClick={() => onOpenSettings(project)} disabled={isDeletingThisProject}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault(); // Prevents DropdownMenu from closing before AlertDialog opens
                    }}
                    disabled={isDeletingThisProject}
                  >
                    {isDeletingThisProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete Project
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>{`This action cannot be undone. This will permanently delete the project "${project.name}" and all its media and settings.`}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsMenuOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDeleteProject(project.id, project.name);
                        setIsMenuOpen(false); 
                      }}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isDeletingThisProject}
                    >
                      {isDeletingThisProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="flex-grow py-2">
        {listContext === "admin" && project.instancePin && (
          <Badge variant="secondary" className="text-xs font-normal py-0.5 px-1.5 w-fit mb-2">
            PIN: {project.instancePin}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground">
          {project.media.length} media item{project.media.length !== 1 ? 's' : ''}
        </p>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
            variant="default"
            size="sm"
            asChild
            onClick={() => {
              setActiveProjectForMenu(project.id);
              // Close menu if it was opened by context menu before navigation
              if (isMenuOpen) setIsMenuOpen(false);
            }}
            className="w-full"
            disabled={isDeletingThisProject}
        >
            <Link href={`/projects/${project.id}`}>
              Manage Media
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ProjectItemCard = React.memo(ProjectItemCardComponent);
