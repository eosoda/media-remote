
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { InstanceDisplayState, Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, RadioTower, AlertTriangle, Folder } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';

interface EnrichedInstanceDisplayState extends InstanceDisplayState {
  pin: string;
  projectName?: string;
  mediaName?: string;
}

export function AdminInstanceTable() {
  const {
    projects,
    isLoading: projectsLoading,
    getAllInstanceDisplayStates,
    deleteInstanceDisplayStateFromAdmin
  } = useProjects();
  const { toast } = useToast();

  const [instances, setInstances] = useState<EnrichedInstanceDisplayState[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(true);
  const [isProcessingInstance, setIsProcessingInstance] = useState<string | null>(null);
  const [instanceToConfirmDelete, setInstanceToConfirmDelete] = useState<EnrichedInstanceDisplayState | null>(null);
  const [associatedProjectsForSingleDelete, setAssociatedProjectsForSingleDelete] = useState<Project[]>([]);

  const [showDeleteOldDialog, setShowDeleteOldDialog] = useState(false);
  const [oldInstancesToDelete, setOldInstancesToDelete] = useState<EnrichedInstanceDisplayState[]>([]);
  const [isDeletingOldInstances, setIsDeletingOldInstances] = useState(false);
  const [associatedProjectsForBulkDelete, setAssociatedProjectsForBulkDelete] = useState<Record<string, Project[]>>({});

  // Default sort by lastSeen descending, which is good for Accordion view
  const sortedInstances = useMemo(() => {
    return [...instances].sort((a, b) => {
      const valA = a.lastSeen;
      const valB = b.lastSeen;
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      return (valB as number) - (valA as number); // Descending
    });
  }, [instances]);

  const fetchAndEnrichInstances = useCallback(async () => {
    setIsLoadingInstances(true);
    try {
      const rawInstances = await getAllInstanceDisplayStates();
      const enriched: EnrichedInstanceDisplayState[] = Object.entries(rawInstances).map(([pin, state]) => {
        const project = state.currentProjectId ? projects.find(p => p.id === state.currentProjectId) : undefined;
        const media = project && state.currentMediaId ? project.media.find(m => m.id === state.currentMediaId) : undefined;
        return {
          ...state,
          pin,
          projectName: project?.name,
          mediaName: media?.name,
        };
      });
      setInstances(enriched);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load display instances.", variant: "destructive" });
      setInstances([]);
    } finally {
        setIsLoadingInstances(false);
    }
  }, [getAllInstanceDisplayStates, projects, toast]);

  useEffect(() => {
    if (!projectsLoading) {
      fetchAndEnrichInstances();
    }
  }, [projectsLoading, fetchAndEnrichInstances]);

  const handleDeleteInstance = useCallback(async (pin: string) => {
    setIsProcessingInstance(pin);
    try {
      await deleteInstanceDisplayStateFromAdmin(pin);
      toast({ title: "Instance State and Associated Projects Deleted", description: `Display instance PIN ${pin} state, and all its associated projects and media, have been deleted.` });
      await fetchAndEnrichInstances(); // Refresh the list
    } catch (error) {
       toast({ title: "Error", description: `Failed to delete instance ${pin} and its projects. Some resources might still exist.`, variant: "destructive" });
    } finally {
      setIsProcessingInstance(null);
      setInstanceToConfirmDelete(null);
    }
  }, [deleteInstanceDisplayStateFromAdmin, toast, fetchAndEnrichInstances]);

  const handleOpenSingleDeleteDialog = (instance: EnrichedInstanceDisplayState) => {
    const associated = projects.filter(p => p.instancePin === instance.pin);
    setAssociatedProjectsForSingleDelete(associated);
    setInstanceToConfirmDelete(instance);
  };

  const handleCheckOldInstances = useCallback(() => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const oldOnes = instances.filter(inst => inst.lastSeen && inst.lastSeen < twentyFourHoursAgo);
    setOldInstancesToDelete(oldOnes);

    if (oldOnes.length > 0) {
      const projectsByPin: Record<string, Project[]> = {};
      oldOnes.forEach(inst => {
        projectsByPin[inst.pin] = projects.filter(p => p.instancePin === inst.pin);
      });
      setAssociatedProjectsForBulkDelete(projectsByPin);
      setShowDeleteOldDialog(true);
    } else {
      toast({ title: "No Old Instances", description: "No display instances older than 24 hours found." });
    }
  }, [instances, projects, toast]);

  const handleConfirmDeleteOldInstances = useCallback(async () => {
    if (oldInstancesToDelete.length === 0) return;
    setIsDeletingOldInstances(true);
    try {
      await Promise.all(oldInstancesToDelete.map(inst => deleteInstanceDisplayStateFromAdmin(inst.pin)));
      toast({ title: "Success", description: `${oldInstancesToDelete.length} old instance(s), their associated projects, and media deleted successfully.` });
      await fetchAndEnrichInstances();
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete some or all old instances and their projects. Please check console for details.", variant: "destructive" });
    } finally {
      setIsDeletingOldInstances(false);
      setShowDeleteOldDialog(false);
      setOldInstancesToDelete([]);
      setAssociatedProjectsForBulkDelete({});
    }
  }, [oldInstancesToDelete, deleteInstanceDisplayStateFromAdmin, toast, fetchAndEnrichInstances]);

  const isLoading = projectsLoading || isLoadingInstances;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading display instances...</span>
      </div>
    );
  }

  return (
    <>
      <div className="my-4 flex justify-end">
        <Button
          variant="outline"
          onClick={handleCheckOldInstances}
          disabled={instances.length === 0 || isDeletingOldInstances || isLoadingInstances}
        >
          {isDeletingOldInstances ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
          Delete Instances &gt; 24h Old
        </Button>
      </div>

      {sortedInstances.length === 0 && !isLoading ? (
         <div className="text-center py-10 text-muted-foreground">
            <RadioTower className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active display instances found.</p>
          </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-350px)]">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {sortedInstances.map((instance) => {
              const associatedProjectsForThisInstance = projects.filter(p => p.instancePin === instance.pin);
              return (
                <AccordionItem value={instance.pin} key={instance.pin} className="border bg-card rounded-md shadow-sm overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline text-left">
                    <div className="flex flex-1 items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <RadioTower className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="font-mono font-semibold text-base truncate" title={`PIN: ${instance.pin}`}>{instance.pin}</span>
                            <Badge variant="secondary" className="whitespace-nowrap">
                                {associatedProjectsForThisInstance.length} project{associatedProjectsForThisInstance.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground text-right whitespace-nowrap flex-shrink-0 ml-2">
                            Last seen: {instance.lastSeen ? formatDistanceToNow(new Date(instance.lastSeen), { addSuffix: true }) : 'N/A'}
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 space-y-4 bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div><strong>Current Project:</strong> <span className="break-all">{instance.projectName || (instance.currentProjectId ? <span className="italic text-muted-foreground">ID: {instance.currentProjectId}</span> : <span className="text-muted-foreground">None</span>)}</span></div>
                      <div><strong>Current Media:</strong> <span className="break-all">{instance.mediaName || (instance.currentMediaId ? <span className="italic text-muted-foreground">ID: {instance.currentMediaId}</span> : <span className="text-muted-foreground">None</span>)}</span></div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1 text-sm">Associated Projects:</h4>
                      {associatedProjectsForThisInstance.length > 0 ? (
                        <ScrollArea className="max-h-32 border rounded-md bg-background p-2">
                            <ul className="space-y-1">
                            {associatedProjectsForThisInstance.map(proj => (
                                <li key={proj.id} className="flex items-center text-xs">
                                <Folder className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate text-muted-foreground" title={proj.name}>{proj.name}</span>
                                </li>
                            ))}
                            </ul>
                        </ScrollArea>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No projects associated with this PIN.</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenSingleDeleteDialog(instance)}
                        disabled={isProcessingInstance === instance.pin}
                      >
                        {isProcessingInstance === instance.pin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Instance & Projects
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      )}

      {/* Dialog for single instance deletion */}
      <AlertDialog open={!!instanceToConfirmDelete} onOpenChange={(isOpen) => !isOpen && setInstanceToConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instance State for PIN {instanceToConfirmDelete?.pin}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will remove the display state for this PIN.
            </AlertDialogDescription>
            {associatedProjectsForSingleDelete.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground pt-2">
                  <span className="font-semibold text-destructive">Importantly, this will also permanently delete the following {associatedProjectsForSingleDelete.length} project(s) and all their media files associated with PIN {instanceToConfirmDelete?.pin}:</span>
                </p>
                <ScrollArea className="max-h-32 mt-1 border rounded-md p-2">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {associatedProjectsForSingleDelete.map(proj => (
                      <li key={proj.id} className="flex items-center">
                        <Folder className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="truncate" title={proj.name}>{proj.name}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </>
            )}
            {associatedProjectsForSingleDelete.length === 0 && instanceToConfirmDelete && (
                 <p className="text-sm text-muted-foreground pt-2">
                    No projects are currently associated with PIN {instanceToConfirmDelete?.pin}. Only the instance state will be deleted.
                 </p>
            )}
             <AlertDialogDescription className="pt-2">
                Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingInstance === instanceToConfirmDelete?.pin} onClick={() => setInstanceToConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => instanceToConfirmDelete && handleDeleteInstance(instanceToConfirmDelete.pin)}
              disabled={isProcessingInstance === instanceToConfirmDelete?.pin}
            >
               {isProcessingInstance === instanceToConfirmDelete?.pin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete State & Projects
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for bulk deleting old instances */}
      <AlertDialog open={showDeleteOldDialog} onOpenChange={setShowDeleteOldDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion of Old Instances & Associated Projects</AlertDialogTitle>
            {oldInstancesToDelete.length > 0 ? (
              <>
                <AlertDialogDescription>
                  The following {oldInstancesToDelete.length} display instance(s) are older than 24 hours. Deleting them will also
                  <span className="font-semibold text-destructive"> permanently delete all projects and media files associated with their PINs</span>.
                </AlertDialogDescription>
                <ScrollArea className="max-h-60 mt-2 border rounded-md p-2">
                  {oldInstancesToDelete.map(inst => (
                    <div key={inst.pin} className="mb-2">
                      <p className="font-mono text-sm font-semibold">PIN: {inst.pin}</p>
                      {associatedProjectsForBulkDelete[inst.pin]?.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 pl-4 text-xs">
                          {associatedProjectsForBulkDelete[inst.pin].map(proj => (
                            <li key={proj.id} className="flex items-center">
                              <Folder className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                              <span className="truncate" title={proj.name}>{proj.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="pl-4 text-xs text-muted-foreground italic">No projects associated with this PIN.</p>
                      )}
                    </div>
                  ))}
                </ScrollArea>
                <AlertDialogDescription className="pt-2">
                  This action cannot be undone.
                </AlertDialogDescription>
              </>
            ) : (
              <AlertDialogDescription>
                No instances older than 24 hours were found to delete.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOldInstances}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDeleteOldInstances}
              disabled={oldInstancesToDelete.length === 0 || isDeletingOldInstances}
            >
              {isDeletingOldInstances ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete {oldInstancesToDelete.length > 0 ? `${oldInstancesToDelete.length} Instance(s) & All Associated Projects` : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    