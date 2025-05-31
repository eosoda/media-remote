
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Loader2, Trash2, RadioTower, AlertTriangle, ArrowUp, ArrowDown, Folder } from "lucide-react";
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


  const [sortConfig, setSortConfig] = useState<{ key: keyof EnrichedInstanceDisplayState | null; direction: 'ascending' | 'descending' }>({
    key: 'lastSeen',
    direction: 'descending',
  });

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
      await fetchAndEnrichInstances();
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

  const requestSort = (key: keyof EnrichedInstanceDisplayState) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedInstances = useMemo(() => {
    let sortableItems = [...instances];
    if (sortConfig.key !== null) {
      const key = sortConfig.key;
      sortableItems.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        let comparison = 0;
        if (key === 'lastSeen') {
          comparison = (valA as number) - (valB as number);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [instances, sortConfig]);

  const SortIndicator = ({ columnKey }: { columnKey: keyof EnrichedInstanceDisplayState }) => {
    if (sortConfig.key !== columnKey) return null;
    const Icon = sortConfig.direction === 'ascending' ? ArrowUp : ArrowDown;
    return <Icon className="ml-1 inline h-3 w-3" />;
  };

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

      {sortedInstances.length === 0 && !isLoading && (
         <div className="text-center py-10 text-muted-foreground">
            <RadioTower className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active display instances found.</p>
          </div>
      )}

      {sortedInstances.length > 0 && (
        <ScrollArea className="h-[calc(100vh-420px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('pin')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  Instance PIN <SortIndicator columnKey="pin" />
                </TableHead>
                <TableHead onClick={() => requestSort('projectName')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  Current Project <SortIndicator columnKey="projectName" />
                </TableHead>
                <TableHead onClick={() => requestSort('mediaName')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  Current Media <SortIndicator columnKey="mediaName" />
                </TableHead>
                <TableHead onClick={() => requestSort('lastSeen')} className="hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors">
                  Last Seen <SortIndicator columnKey="lastSeen" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInstances.map((instance) => (
                <TableRow key={instance.pin}>
                  <TableCell className="font-mono font-semibold">{instance.pin}</TableCell>
                  <TableCell>
                    {instance.projectName || (instance.currentProjectId ? <span className="text-muted-foreground italic">ID: {instance.currentProjectId}</span> : <span className="text-muted-foreground">None</span>)}
                  </TableCell>
                  <TableCell>
                    {instance.mediaName || (instance.currentMediaId ? <span className="text-muted-foreground italic">ID: {instance.currentMediaId}</span> : <span className="text-muted-foreground">None</span>)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {instance.lastSeen ?
                      <span title={new Date(instance.lastSeen).toLocaleString()}>
                        {formatDistanceToNow(new Date(instance.lastSeen), { addSuffix: true })}
                      </span>
                      : <span className="text-muted-foreground">N/A</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Instance State and Associated Projects"
                      disabled={isProcessingInstance === instance.pin}
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleOpenSingleDeleteDialog(instance)}
                    >
                      {isProcessingInstance === instance.pin ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
