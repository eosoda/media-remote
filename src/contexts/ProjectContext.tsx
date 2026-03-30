
"use client";

import type {
  Project,
  MediaFile,
  InstanceDisplayState,
  ProjectDocumentData,
  MediaFileDocumentData,
} from "@/types";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { firestore } from "@/lib/firebase"; 
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  Timestamp, 
  orderBy,
  writeBatch,
  setDoc,
} from "firebase/firestore";


const PROJECTS_COLLECTION = "projects";
const MEDIA_SUBCOLLECTION = "media";
const INSTANCE_DISPLAY_STATE_COLLECTION = "instanceDisplayState";

const INSTANCE_PIN_KEY = "media-remote-instance-pin";
const INSTANCE_PIN_EXPIRY_KEY = "media-remote-instance-pin-expiry";
const INSTANCE_PIN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ProjectContextType {
  projects: Project[];
  instanceProjects: Project[];
  activeProjectForMenu: Project | null;
  activeProjectMedia: MediaFile[];
  instancePin: string | null;
  isLoading: boolean;
  isUserAdmin: boolean;
  addProject: (
    name: string,
    instancePin: string
  ) => Promise<Project | null>;
  getProject: (id: string) => Project | undefined;
  addMediaToProject: ( 
    projectId: string,
    file: File, 
    url: string,
    publicId: string,
    thumbnailUrl?: string,
    thumbnailPublicId?: string
  ) => Promise<MediaFile | undefined>;
  deleteMedia: (projectId: string, mediaId: string) => Promise<void>; 
  setCurrentMediaForProject: (
    projectId: string,
    mediaId: string | null
  ) => Promise<void>;
  setActiveProjectForMenu: (projectId: string | null) => void;
  deleteProject: (projectId: string) => Promise<void>;
  checkAdminPassword: (password: string) => boolean;
  logoutAdmin: () => void;
  getOrCreateInstancePin: () => string;
  updateDisplayForInstance: (
    targetInstancePin: string,
    projectId: string,
    mediaId: string | null
  ) => Promise<void>;
  listenToInstanceDisplayState: (
    instancePinToListen: string,
    onDataChange: (data: InstanceDisplayState | null) => void
  ) => () => void;
  createInstanceDisplayStateIfNeeded: (pin: string) => Promise<void>;
  updateProjectName: (projectId: string, newName: string) => Promise<void>;
  updateProjectSettings: (
    projectId: string,
    settings: {
      name?: string;
      defaultDisplayBackground?: string | null; 
      defaultDisplayBackgroundStoragePath?: string | null; 
    }
  ) => Promise<void>;
  getAllInstanceDisplayStates: () => Promise<
    Record<string, InstanceDisplayState>
  >;
  clearInstanceDisplayState: (pin: string) => Promise<void>;
  deleteInstanceDisplayStateFromAdmin: (pin: string) => Promise<void>;
  updateMediaOrder: (projectId: string, orderedMedia: MediaFile[]) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

const generateInstancePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [instanceProjects, setInstanceProjects] = useState<Project[]>([]);
  const [activeProjectMedia, setActiveProjectMedia] = useState<MediaFile[]>([]);
  const [activeProjectForMenuId, setActiveProjectForMenuId] = useState<
    string | null
  >(null);
  const [instancePin, setInstancePin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const getOrCreateInstancePin = useCallback((): string => {
    let currentPin: string | null = null;
    let expiry: string | null = null;

    if (typeof window !== "undefined") {
      currentPin = localStorage.getItem(INSTANCE_PIN_KEY);
      expiry = localStorage.getItem(INSTANCE_PIN_EXPIRY_KEY);
    }

    const now = new Date().getTime();

    if (currentPin && expiry && parseInt(expiry, 10) > now) {
      if (instancePin !== currentPin) setInstancePin(currentPin);
      return currentPin;
    }

    const newPin = generateInstancePin();
    const newExpiry = (now + INSTANCE_PIN_DURATION_MS).toString();

    if (typeof window !== "undefined") {
      localStorage.setItem(INSTANCE_PIN_KEY, newPin);
      localStorage.setItem(INSTANCE_PIN_EXPIRY_KEY, newExpiry);
    }
    setInstancePin(newPin);
    return newPin;
  }, [instancePin]);

  const createInstanceDisplayStateIfNeeded = useCallback(async (pin: string) => {
    if (!pin) return;
    const instanceStateDocRef = doc(firestore, INSTANCE_DISPLAY_STATE_COLLECTION, pin);
    const docSnap = await getDoc(instanceStateDocRef);
    if (!docSnap.exists()) {
      try {
        await setDoc(instanceStateDocRef, {
          currentProjectId: null,
          currentMediaId: null,
          lastSeen: Timestamp.now().toMillis(),
        });
      } catch (error) {
        console.error("Error creating instance display state:", error)
      }
    }
  }, []);

  useEffect(() => {
    const pin = getOrCreateInstancePin();
    setInstancePin(pin);
    createInstanceDisplayStateIfNeeded(pin);
  }, [getOrCreateInstancePin, createInstanceDisplayStateIfNeeded]);


  useEffect(() => {
    setIsLoading(true);
    const projectsCollectionRef = collection(firestore, PROJECTS_COLLECTION);
    const q = query(projectsCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribeProjects = onSnapshot(
      q,
      async (querySnapshot) => {
        const fetchedProjects: Project[] = [];
        for (const projectDoc of querySnapshot.docs) {
          const projectData = projectDoc.data() as ProjectDocumentData;
          const mediaCollectionRef = collection(
            projectDoc.ref,
            MEDIA_SUBCOLLECTION
          );
          const mediaQuery = query(mediaCollectionRef, orderBy("order", "asc"));
          const mediaSnapshot = await getDocs(mediaQuery);
          const mediaFiles: MediaFile[] = mediaSnapshot.docs.map((mediaDoc, index) => {
            const mediaData = mediaDoc.data() as MediaFileDocumentData;
            return {
              id: mediaDoc.id, 
              ...mediaData,
              uploadedAt: new Date(mediaData.uploadedAt),
              order: mediaData.order !== undefined ? mediaData.order : index, 
            };
          });

          fetchedProjects.push({
            id: projectDoc.id,
            name: projectData.name,
            slug: projectData.slug,
            media: mediaFiles,
            currentMediaId: projectData.currentMediaId,
            createdAt: new Date(projectData.createdAt),
            instancePin: projectData.instancePin,
            defaultDisplayBackground: projectData.defaultDisplayBackground,
            defaultDisplayBackgroundStoragePath: projectData.defaultDisplayBackgroundStoragePath,
          });
        }
        setProjects(fetchedProjects);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore error fetching projects:", error);
        setProjects([]);
        setIsLoading(false);
      }
    );
    return () => unsubscribeProjects();
  }, []);

  useEffect(() => {
    if (!activeProjectForMenuId) {
      setActiveProjectMedia([]);
      return;
    }

    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, activeProjectForMenuId);
    const mediaCollectionRef = collection(projectDocRef, MEDIA_SUBCOLLECTION);
    const mediaQuery = query(mediaCollectionRef, orderBy("order", "asc")); 

    const unsubscribeMedia = onSnapshot(mediaQuery, (mediaSnapshot) => {
      const fetchedMedia: MediaFile[] = mediaSnapshot.docs.map((mediaDoc, index) => { 
        const mediaData = mediaDoc.data() as MediaFileDocumentData;
        return {
          id: mediaDoc.id,
          ...mediaData,
          uploadedAt: new Date(mediaData.uploadedAt),
          order: mediaData.order !== undefined ? mediaData.order : index, 
        };
      });
      setActiveProjectMedia(fetchedMedia);
    }, (error) => {
      console.error("Firestore error fetching media for active project:", error);
      setActiveProjectMedia([]);
    });

    return () => unsubscribeMedia();
  }, [activeProjectForMenuId]);

  useEffect(() => {
    if (instancePin && projects.length > 0) {
      setInstanceProjects(projects.filter(p => p.instancePin === instancePin));
    } else if (instancePin) {
       setInstanceProjects([]);
    }
  }, [instancePin, projects]);

  const addProject = useCallback(async (
    name: string,
    pin: string
  ): Promise<Project | null> => {
    if (!pin) {
      console.error("Instance PIN is required to create a project.");
      return null;
    }
    const newProjectData: ProjectDocumentData = {
      name,
      slug: generateSlug(name),
      currentMediaId: null,
      createdAt: Timestamp.now().toMillis(),
      instancePin: pin,
    };
    try {
      const docRef = await addDoc(
        collection(firestore, PROJECTS_COLLECTION),
        newProjectData
      );
      return {
        id: docRef.id,
        media: [],
        ...newProjectData,
        createdAt: new Date(newProjectData.createdAt),
      };
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
      return null;
    }
  }, []);

  const getProject = useCallback((id: string): Project | undefined => {
    return projects.find((p) => p.id === id);
  }, [projects]);

  const addMediaToProject = useCallback(async (
    projectId: string,
    file: File, 
    url: string,
    publicId: string,
    thumbnailUrl?: string,
    thumbnailPublicId?: string
  ): Promise<MediaFile | undefined> => {
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);

    const projectFromState = projects.find(p => p.id === projectId);
    const currentMediaCount = projectFromState?.media?.length || 0;

    const mediaId = uuidv4(); 
    const currentTime = Date.now();

    const newMediaFile: MediaFile = {
      id: mediaId, 
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "video",
      url: url, 
      size: file.size,
      uploadedAt: new Date(currentTime),
      storagePath: publicId, 
      thumbnailUrl: thumbnailUrl,
      thumbnailStoragePath: thumbnailPublicId,
      order: currentMediaCount, 
    };

    const mediaDocData: MediaFileDocumentData = {
      name: newMediaFile.name,
      type: newMediaFile.type,
      url: newMediaFile.url,
      size: newMediaFile.size,
      uploadedAt: currentTime, 
      storagePath: newMediaFile.storagePath,
      order: newMediaFile.order,
      ...(newMediaFile.thumbnailUrl && { thumbnailUrl: newMediaFile.thumbnailUrl }),
      ...(newMediaFile.thumbnailStoragePath && { thumbnailStoragePath: newMediaFile.thumbnailStoragePath }),
    };
    
    try {
      const mediaSubcollectionRef = collection(projectDocRef, MEDIA_SUBCOLLECTION);
      const mediaDocRefFirestore = doc(mediaSubcollectionRef, mediaId);
      await setDoc(mediaDocRefFirestore, mediaDocData); 
      
      setProjects(prevProjects =>
        prevProjects.map(p => {
          if (p.id === projectId) {
            const updatedMediaArray = p.media ? [...p.media, newMediaFile] : [newMediaFile];
            updatedMediaArray.sort((a, b) => a.order - b.order);
            return { 
              ...p, 
              media: updatedMediaArray
            };
          }
          return p;
        })
      );

      if (activeProjectForMenuId === projectId) {
        setActiveProjectMedia(prevMedia => {
          const updatedMediaArray = prevMedia ? [...prevMedia, newMediaFile] : [newMediaFile];
          updatedMediaArray.sort((a, b) => a.order - b.order);
          return updatedMediaArray;
        });
      }
      
      return newMediaFile; 
    } catch (error) {
      console.error("Error saving media metadata to Firestore:", error);
      return undefined;
    }
  }, [projects, activeProjectForMenuId]);
  
const deleteMedia = useCallback(async (
    projectId: string,
    mediaId: string
  ): Promise<void> => {
    const projectRef = getProject(projectId); 
    const mediaToDelete = projectRef?.media.find((m) => m.id === mediaId);

    if (!projectRef || !mediaToDelete) {
      console.error("Project or media not found for deletion.", { projectId, mediaId, projectRef });
      throw new Error("Media information incomplete for deletion.");
    }

    try {
      if (mediaToDelete.storagePath) {
        await fetch('/api/cloudinary/delete', { method: 'POST', body: JSON.stringify({ publicId: mediaToDelete.storagePath }) });
      }
      if (mediaToDelete.thumbnailStoragePath) {
        await fetch('/api/cloudinary/delete', { method: 'POST', body: JSON.stringify({ publicId: mediaToDelete.thumbnailStoragePath }) });
      }
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      throw new Error(`Failed to delete media from storage: ${error instanceof Error ? error.message : String(error)}`);
    }

    const mediaDocRef = doc(firestore, PROJECTS_COLLECTION, projectId, MEDIA_SUBCOLLECTION, mediaId);
    await deleteDoc(mediaDocRef);

    let newCurrentMediaIdForProject: string | null = projectRef.currentMediaId;
    let requiresCurrentMediaUpdateInDb = false;

    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const filteredMedia = p.media.filter(m => m.id !== mediaId);
          const updatedMedia = filteredMedia
                                     .sort((a, b) => a.order - b.order) 
                                     .map((m, index) => ({ ...m, order: index })); 

          if (p.currentMediaId === mediaId) { 
            newCurrentMediaIdForProject = updatedMedia.length > 0 ? updatedMedia[0].id : null;
            requiresCurrentMediaUpdateInDb = true;
          }
          return { ...p, media: updatedMedia, currentMediaId: newCurrentMediaIdForProject };
        }
        return p;
      })
    );

    if (activeProjectForMenuId === projectId) {
      setActiveProjectMedia(prevMedia => {
        const filteredMedia = prevMedia.filter(m => m.id !== mediaId);
        return filteredMedia
            .sort((a,b) => a.order - b.order)
            .map((m, index) => ({ ...m, order: index }));
      });
    }
    
    if (requiresCurrentMediaUpdateInDb) {
      const projectDocFirestoreRef = doc(firestore, PROJECTS_COLLECTION, projectId);
      updateDoc(projectDocFirestoreRef, { currentMediaId: newCurrentMediaIdForProject }).catch(err => {
        console.error("Error updating currentMediaId in Firestore post-delete:", err);
      });
    }
    
    const projectDataForOrderUpdate = projects.find(p => p.id === projectId);
    if (projectDataForOrderUpdate) {
        const remainingMedia = projectDataForOrderUpdate.media.filter(m => m.id !== mediaId).sort((a,b) => a.order - b.order);
        if (remainingMedia.some((m, i) => m.order !== i)) { 
            const batch = writeBatch(firestore);
            remainingMedia.forEach((item, index) => {
                const itemDocRef = doc(firestore, PROJECTS_COLLECTION, projectId, MEDIA_SUBCOLLECTION, item.id);
                batch.update(itemDocRef, { order: index });
            });
            await batch.commit().catch(err => console.error("Error batch updating media order in Firestore:", err));
        }
    }


  }, [getProject, projects, activeProjectForMenuId]); 
  
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    const project = getProject(projectId); 
    const projectToProcess = project || projects.find(p => p.id === projectId);

    if (!projectToProcess) {
        console.warn(`Project with ID ${projectId} not found for deletion.`);
        return;
    }

    const batch = writeBatch(firestore);
    
    // Cloudinary Folder Deletion
    const folderPath = `media/${projectToProcess.instancePin}/${projectId}`;
    try {
        await fetch('/api/cloudinary/delete-folder', { method: 'POST', body: JSON.stringify({ folderPath }) });
    } catch (folderDeleteError) {
        console.error(`Error deleting folder ${folderPath} from Cloudinary:`, folderDeleteError);
    }
    
    for (const mediaFile of projectToProcess.media) {
        const mediaDocRef = doc(firestore, PROJECTS_COLLECTION, projectId, MEDIA_SUBCOLLECTION, mediaFile.id);
        batch.delete(mediaDocRef);
    }

    // Default background deletion (in case it is stored outside the project folder)
    if (projectToProcess.defaultDisplayBackgroundStoragePath && !projectToProcess.defaultDisplayBackgroundStoragePath.startsWith(folderPath)) {
        try {
            await fetch('/api/cloudinary/delete', { method: 'POST', body: JSON.stringify({ publicId: projectToProcess.defaultDisplayBackgroundStoragePath }) });
        } catch (storageError) {
            console.error(`Error deleting project background ${projectToProcess.defaultDisplayBackgroundStoragePath} from Cloudinary:`, storageError);
        }
    }
    
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    batch.delete(projectDocRef);

    try {
        await batch.commit();
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        if (activeProjectForMenuId === projectId) {
          setActiveProjectForMenuId(null);
          setActiveProjectMedia([]);
        }
    } catch(error) {
        console.error("Error deleting project with batch from Firestore:", error);
        throw error; 
    }
  }, [projects, getProject, activeProjectForMenuId]); 

  const setCurrentMediaForProject = useCallback(async (
    projectId: string,
    mediaId: string | null
  ): Promise<void> => {
    // 1. Update the project document itself
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectDocRef, { currentMediaId: mediaId });

    // 2. Also update the instanceDisplayState for the project's own instancePin
    const project = projects.find(p => p.id === projectId);
    if (project && project.instancePin) {
      const instanceStateDocRef = doc(
        firestore,
        INSTANCE_DISPLAY_STATE_COLLECTION,
        project.instancePin
      );
      const stateToSet: InstanceDisplayState = {
        currentProjectId: projectId,
        currentMediaId: mediaId,
        lastSeen: Timestamp.now().toMillis(),
      };
      await setDoc(instanceStateDocRef, stateToSet, { merge: true });
    } else {
      console.warn(`Project or instancePin not found for projectId: ${projectId} when trying to sync instance display state in setCurrentMediaForProject.`);
    }
  }, [projects]);

  const setActiveProjectForMenu = useCallback((projectId: string | null): void => {
    setActiveProjectForMenuId(projectId);
  }, []);
  
  const updateDisplayForInstance = useCallback(async (
    targetInstancePin: string,
    projectId: string,
    mediaId: string | null
  ): Promise<void> => {
    // 1. Update the target instanceDisplayState document
    const instanceStateDocRef = doc(
      firestore,
      INSTANCE_DISPLAY_STATE_COLLECTION,
      targetInstancePin
    );
    const stateToSet: InstanceDisplayState = {
      currentProjectId: projectId,
      currentMediaId: mediaId,
      lastSeen: Timestamp.now().toMillis(),
    };
    await setDoc(instanceStateDocRef, stateToSet, { merge: true });

    // 2. ALSO ensure the project's own currentMediaId and its native instanceDisplayState are updated.
    //    setCurrentMediaForProject now handles both of these aspects.
    if (projectId) { 
        await setCurrentMediaForProject(projectId, mediaId);
    }
  }, [setCurrentMediaForProject]);

  const listenToInstanceDisplayState = useCallback((
    instancePinToListen: string,
    onDataChange: (data: InstanceDisplayState | null) => void
  ): (() => void) => {
    const instanceStateDocRef = doc(
      firestore,
      INSTANCE_DISPLAY_STATE_COLLECTION,
      instancePinToListen
    );
    const unsubscribe = onSnapshot(
      instanceStateDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          onDataChange(docSnapshot.data() as InstanceDisplayState);
        } else {
          createInstanceDisplayStateIfNeeded(instancePinToListen);
          onDataChange(null); 
        }
      },
      (error) => {
        console.error(
          `Firestore error listening to instance ${instancePinToListen}:`,
          error
        );
        onDataChange(null);
      }
    );
    return unsubscribe;
  }, [createInstanceDisplayStateIfNeeded]);

  const checkAdminPassword = useCallback((password: string): boolean => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "1234";
    const isAdmin = password === adminPassword;
    if (isAdmin) {
      setIsUserAdmin(true);
      if(typeof window !== "undefined") localStorage.setItem("isAdminAuthenticated", "true");
    }
    return isAdmin;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsUserAdmin(false);
    if(typeof window !== "undefined") localStorage.removeItem("isAdminAuthenticated");
  }, []);

  useEffect(() => {
    if(typeof window !== "undefined" && localStorage.getItem("isAdminAuthenticated") === "true") {
        setIsUserAdmin(true);
    }
  }, []);

  const updateProjectName = useCallback(async (
    projectId: string,
    newName: string
  ): Promise<void> => {
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectDocRef, {
      name: newName,
      slug: generateSlug(newName),
    });
  }, []);

  const updateProjectSettings = useCallback(
    async (
      projectId: string,
      settings: {
        name?: string;
        defaultDisplayBackground?: string | null; 
        defaultDisplayBackgroundStoragePath?: string | null; 
      }
    ): Promise<void> => {
      const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
      const currentProject = getProject(projectId); 
      const updates: Partial<ProjectDocumentData & { defaultDisplayBackgroundStoragePath?: string | null }> = {};
  
      if (settings.name && settings.name !== currentProject?.name) {
        updates.name = settings.name;
        updates.slug = generateSlug(settings.name);
      }
      
      const newBackgroundUrl = settings.defaultDisplayBackground;
      const newStoragePath = settings.defaultDisplayBackgroundStoragePath;
      const oldStoragePath = currentProject?.defaultDisplayBackgroundStoragePath;
  
      if (newStoragePath !== undefined) { 
        if (oldStoragePath && oldStoragePath !== newStoragePath) {
            try {
              await fetch('/api/cloudinary/delete', { method: 'POST', body: JSON.stringify({ publicId: oldStoragePath }) });
            } catch (error) {
              console.error("Error deleting old project background from Cloudinary:", error);
            }
        }
        // Map null to undefined to satisfy ProjectDocumentData type without causing type errors
        updates.defaultDisplayBackground = newBackgroundUrl === null ? undefined : newBackgroundUrl; 
        updates.defaultDisplayBackgroundStoragePath = newStoragePath === null ? undefined : newStoragePath; 
      }
  
      if (Object.keys(updates).length > 0) {
        await updateDoc(projectDocRef, updates);
        setProjects(prevProjects => prevProjects.map(p => {
          if (p.id === projectId) {
            return { ...p, ...updates, createdAt: new Date(p.createdAt) }; 
          }
          return p;
        }));
      }
    },
    [getProject, projects]
  );


  const getAllInstanceDisplayStates = useCallback(async (): Promise<
    Record<string, InstanceDisplayState>
  > => {
    const snapshot = await getDocs(collection(firestore, INSTANCE_DISPLAY_STATE_COLLECTION));
    const states: Record<string, InstanceDisplayState> = {};
    snapshot.forEach(doc => {
        states[doc.id] = doc.data() as InstanceDisplayState;
    });
    return states;
  }, []);

  const clearInstanceDisplayState = useCallback(async (pin: string): Promise<void> => {
    const instanceDocRef = doc(firestore, INSTANCE_DISPLAY_STATE_COLLECTION, pin);
    const docSnap = await getDoc(instanceDocRef);
    if (docSnap.exists()) {
      await updateDoc(instanceDocRef, {
        currentProjectId: null,
        currentMediaId: null,
        lastSeen: Timestamp.now().toMillis(),
      });
    } else {
      await setDoc(instanceDocRef, {
        currentProjectId: null,
        currentMediaId: null,
        lastSeen: Timestamp.now().toMillis(),
      });
    }
  }, []);

  const deleteInstanceDisplayStateFromAdmin = useCallback(async (pin: string): Promise<void> => {
    const projectsToDelete = projects.filter(p => p.instancePin === pin);
    
    for (const project of projectsToDelete) {
      try {
        await deleteProject(project.id); 
      } catch (error) {
        console.error(`Failed to delete project ${project.id} (PIN: ${pin}) during instance state deletion:`, error);
      }
    }
    
    const instanceDocRef = doc(firestore, INSTANCE_DISPLAY_STATE_COLLECTION, pin);
    try {
        await deleteDoc(instanceDocRef);
    } catch (error) {
        console.error(`Failed to delete instance state document for PIN ${pin}:`, error);
        throw error; 
    }
  }, [projects, deleteProject]);
  
  const updateMediaOrder = useCallback(async (projectId: string, orderedMedia: MediaFile[]): Promise<void> => {
    const batch = writeBatch(firestore);
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    const mediaCollectionRef = collection(projectDocRef, MEDIA_SUBCOLLECTION);

    orderedMedia.forEach((mediaItem, index) => {
      const mediaDocRef = doc(mediaCollectionRef, mediaItem.id);
      batch.update(mediaDocRef, { order: index });
    });

    try {
      await batch.commit();
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === projectId) {
          const orderMap = new Map(orderedMedia.map(m => [m.id, m.order]));
          const newMedia = p.media
            .map(m => ({ ...m, order: orderMap.get(m.id) ?? m.order })) 
            .sort((a, b) => a.order - b.order); 
          return { ...p, media: newMedia };
        }
        return p;
      }));
      if(activeProjectForMenuId === projectId) {
        setActiveProjectMedia(prevMedia => {
            const orderMap = new Map(orderedMedia.map(m => [m.id, m.order]));
            return prevMedia
                .map(m => ({...m, order: orderMap.get(m.id) ?? m.order}))
                .sort((a,b) => a.order - b.order);
        });
      }

    } catch (error) {
      console.error("Error updating media order in Firestore:", error);
      throw error;
    }
  }, [activeProjectForMenuId, projects]); 

  const activeProjectForMenu = projects.find((p) => p.id === activeProjectForMenuId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        instanceProjects,
        activeProjectForMenu,
        activeProjectMedia,
        instancePin,
        isLoading,
        isUserAdmin,
        addProject,
        getProject,
        addMediaToProject,
        deleteMedia,
        setCurrentMediaForProject,
        setActiveProjectForMenu,
        deleteProject,
        checkAdminPassword,
        logoutAdmin,
        getOrCreateInstancePin,
        updateDisplayForInstance,
        listenToInstanceDisplayState,
        createInstanceDisplayStateIfNeeded,
        updateProjectName,
        updateProjectSettings,
        getAllInstanceDisplayStates,
        clearInstanceDisplayState,
        deleteInstanceDisplayStateFromAdmin,
        updateMediaOrder,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};

    
