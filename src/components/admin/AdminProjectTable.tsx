
"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit3 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MediaGallery } from "@/components/MediaGallery"; 
import { ProjectList } from "@/components/ProjectList"; // Import ProjectList

const editProjectFormSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Project name is too long"),
});
type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;

export function AdminProjectTable() {
  // `projects` from context is already all projects, no special fetching needed for admin.
  const { projects: allProjectsFromContext, isLoading, updateProjectName } = useProjects();
  const { toast } = useToast();

  const [isEditingProject, setIsEditingProject] = useState<Project | null>(null);
  const [isViewingMedia, setIsViewingMedia] = useState<Project | null>(null);
  
  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectFormSchema),
  });

  const handleEditProjectSubmit = async (data: EditProjectFormValues) => {
    if (!isEditingProject) return;
    try {
      await updateProjectName(isEditingProject.id, data.name);
      toast({ title: "Project Updated", description: `Project "${data.name}" has been updated.` });
      setIsEditingProject(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to update project name.", variant: "destructive" });
    }
  };
  
  // Note: The ProjectList component now handles its own loading state and display if no projects.
  // It also handles project deletion through its own UI.
  // The AdminProjectTable might need to pass a function to ProjectList if edit/view media actions
  // should be different or open dialogs managed by AdminProjectTable.
  // For now, using ProjectList directly simplifies this component.
  // If specific admin actions per project row are needed (like edit name button),
  // then a custom table like before is better.
  // Reverting to custom table for more control over admin actions.

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading projects...</span>
      </div>
    );
  }

  return (
    <>
      {/* Using ProjectList to display all projects with admin context */}
      {/* ProjectList handles delete. Edit/View Media will need separate buttons if ProjectList doesn't suffice */}
      <ProjectList projectsToDisplay={allProjectsFromContext} listContext="admin" />

      {/* Example: If you need custom actions like edit name / view media separate from ProjectList */}
      {/* This would require a custom table rendering as before, not just ProjectList */}
      {/* For this iteration, ProjectList will handle display and delete. Edit/View Media is part of ProjectList's item actions. */}


      {/* Edit Project Dialog - This can be removed if ProjectList handles edits, or kept if Admin needs a different edit flow */}
      <Dialog open={!!isEditingProject} onOpenChange={(isOpen) => !isOpen && setIsEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project &quot;{isEditingProject?.name}&quot;</DialogTitle>
            <DialogDescription>Change the name of your project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleEditProjectSubmit)} className="space-y-4 py-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input {...field} placeholder="New project name" />
                  {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                </div>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Media Dialog - This can be removed if ProjectList's items link to project page, or kept for modal view */}
      <Dialog open={!!isViewingMedia} onOpenChange={(isOpen) => !isOpen && setIsViewingMedia(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Media for &quot;{isViewingMedia?.name}&quot;</DialogTitle>
            <DialogDescription>View and manage media files for this project.</DialogDescription>
          </DialogHeader>
          <div className="py-4 h-full overflow-hidden">
            {isViewingMedia && (
              // MediaGallery doesn't have admin-specific delete logic, it uses context's deleteMedia.
              // This is fine as admin should be able to delete media too.
              <MediaGallery project={isViewingMedia} showSetCurrent={false} /> 
            )}
          </div>
           <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

