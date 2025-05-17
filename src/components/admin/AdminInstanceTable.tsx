
"use client";

import { useEffect, useState, useCallback } from "react";
import type { InstanceDisplayState, Project } from "@/types";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PowerOff, RadioTower, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    clearInstanceDisplayState, 
    deleteInstanceDisplayStateFromAdmin 
  } = useProjects();
  const { toast } = useToast();

  const [instances, setInstances] = useState<EnrichedInstanceDisplayState[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(true);
  const [isProcessingInstance, setIsProcessingInstance] = useState<string | null>(null);

  const [showDeleteOldDialog, setShowDeleteOldDialog] = useState(false);
  const [oldInstancesToDelete, setOldInstancesToDelete] = useState<EnrichedInstanceDisplayState[]>([]);
  const [isDeletingOldInstances, setIsDeletingOldInstances] = useState(false);

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
      console.error("Failed to load display instances:", error)
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

  const handleClearInstance = useCallback(async (pin: string) => {
    setIsProcessingInstance(pin);
    try {
      await clearInstanceDisplayState(pin);
      toast({ title: "Instance Cleared", description: `Display instance PIN ${pin} has been cleared.` });
      await fetchAndEnrichInstances(); 
    } catch (error) {
      toast({ title: "Error", description: `Failed to clear instance ${pin}.`, variant: "destructive" });
      console.error(`Failed to clear instance ${pin}:`, error);
    } finally {
      setIsProcessingInstance(null);
    }
  }, [clearInstanceDisplayState, toast, fetchAndEnrichInstances]);

  const handleDeleteInstance = useCallback(async (pin: string) => {
    setIsProcessingInstance(pin);
    try {
      await deleteInstanceDisplayStateFromAdmin(pin); 
      toast({ title: "Instance Deleted", description: `Display instance PIN ${pin} state has been deleted.` });
      setInstances(prev => prev.filter(inst => inst.pin !== pin));
    } catch (error) {
       toast({ title: "Error", description: `Failed to delete instance ${pin}.`, variant: "destructive" });
       console.error(`Failed to delete instance ${pin}:`, error);
    } finally {
      setIsProcessingInstance(null);
    }
  }, [deleteInstanceDisplayStateFromAdmin, toast]);

  const handleCheckOldInstances = useCallback(() => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const oldOnes = instances.filter(inst => inst.lastSeen && inst.lastSeen < twentyFourHoursAgo);
    setOldInstancesToDelete(oldOnes);
    if (oldOnes.length > 0) {
      setShowDeleteOldDialog(true);
    } else {
      toast({ title: "No Old Instances", description: "No display instances older than 24 hours found." });
    }
  }, [instances, toast]);

  const handleConfirmDeleteOldInstances = useCallback(async () => {
    if (oldInstancesToDelete.length === 0) return;
    setIsDeletingOldInstances(true);
    try {
      await Promise.all(oldInstancesToDelete.map(inst => deleteInstanceDisplayStateFromAdmin(inst.pin)));
      toast({ title: "Success", description: `${oldInstancesToDelete.length} old instance(s) deleted successfully.` });
      await fetchAndEnrichInstances(); 
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete some or all old instances. Please check console for details.", variant: "destructive" });
        console.error("Failed to delete old instances:", error);
    } finally {
      setIsDeletingOldInstances(false);
      setShowDeleteOldDialog(false);
      setOldInstancesToDelete([]);
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
        <AlertDialog open={showDeleteOldDialog} onOpenChange={setShowDeleteOldDialog}>
          <Button 
            variant="outline" 
            onClick={handleCheckOldInstances}
            disabled={instances.length === 0 || isDeletingOldInstances || isLoadingInstances}
          >
            {isDeletingOldInstances ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Delete Instances &gt; 24h Old
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion of Old Instances</AlertDialogTitle>
              {oldInstancesToDelete.length > 0 ? (
                <AlertDialogDescription>
                  The following {oldInstancesToDelete.length} display instance(s) are older than 24 hours and will be deleted:
                  <ScrollArea className="max-h-40 mt-2 border rounded-md p-2">
                    <ul className="list-disc list-inside space-y-1">
                      {oldInstancesToDelete.map(inst => <li key={inst.pin} className="font-mono text-sm">{inst.pin}</li>)}
                    </ul>
                  </ScrollArea>
                  This action cannot be undone and will remove their state from the system.
                </AlertDialogDescription>
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
                Delete {oldInstancesToDelete.length > 0 ? `${oldInstancesToDelete.length} Instance(s)` : ""}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {instances.length === 0 && !isLoading && (
         <div className="text-center py-10 text-muted-foreground">
            <RadioTower className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active display instances found.</p>
          </div>
      )}

      {instances.length > 0 && (
        <ScrollArea className="h-[calc(100vh-420px)]"> 
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instance PIN</TableHead>
                <TableHead>Current Project</TableHead>
                <TableHead>Current Media</TableHead>
                <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance) => (
                <TableRow key={instance.pin}>
                  <TableCell className="font-mono font-semibold">{instance.pin}</TableCell>
                  <TableCell>
                    {instance.projectName || (instance.currentProjectId ? `ID: ${instance.currentProjectId}` : 'None')}
                  </TableCell>
                  <TableCell>
                    {instance.mediaName || (instance.currentMediaId ? `ID: ${instance.currentMediaId}` : 'None')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {instance.lastSeen ? new Date(instance.lastSeen).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleClearInstance(instance.pin)}
                      disabled={isProcessingInstance === instance.pin}
                      title="Clear Display (set to no media)"
                    >
                      {isProcessingInstance === instance.pin ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <PowerOff className="h-4 w-4 mr-1" />}
                      Clear
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          disabled={isProcessingInstance === instance.pin}
                          title="Delete Instance State"
                        >
                          {isProcessingInstance === instance.pin ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Instance State for PIN {instance.pin}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. It will remove the display state for this PIN.
                            The physical display will revert to its 'Ready' screen. 
                            This does NOT delete any projects or media.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDeleteInstance(instance.pin)}
                            disabled={isProcessingInstance === instance.pin}
                          >
                             {isProcessingInstance === instance.pin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete State
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </>
  );
}
