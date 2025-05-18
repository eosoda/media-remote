
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
import { minioS3Client, MINIO_BUCKET_NAME } from "@/lib/minio"; 
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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
  activeProjectMedia: MediaFile[]; // Added for real-time media updates on the active project
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
    minioObjectKey: string
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
  getAllInstanceDisplayStates: () => Promise<
    Record<string, InstanceDisplayState>
  >;
  clearInstanceDisplayState: (pin: string) => Promise<void>;
  deleteInstanceDisplayStateFromAdmin: (pin: string) => Promise<void>;
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
  const [activeProjectMedia, setActiveProjectMedia] = useState<MediaFile[]>([]); // New state for active project media
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
          const mediaQuery = query(mediaCollectionRef, orderBy("uploadedAt", "asc"));
          const mediaSnapshot = await getDocs(mediaQuery);
          const mediaFiles: MediaFile[] = mediaSnapshot.docs.map((mediaDoc) => {
            const mediaData = mediaDoc.data() as MediaFileDocumentData;
            return {
              id: mediaDoc.id, 
              ...mediaData,
              uploadedAt: new Date(mediaData.uploadedAt),
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

  // Effect to listen to media subcollection of the active project
  useEffect(() => {
    if (!activeProjectForMenuId) {
      setActiveProjectMedia([]);
      return;
    }

    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, activeProjectForMenuId);
    const mediaCollectionRef = collection(projectDocRef, MEDIA_SUBCOLLECTION);
    const mediaQuery = query(mediaCollectionRef, orderBy("uploadedAt", "asc"));

    const unsubscribeMedia = onSnapshot(mediaQuery, (mediaSnapshot) => {
      const fetchedMedia: MediaFile[] = mediaSnapshot.docs.map((mediaDoc) => {
        const mediaData = mediaDoc.data() as MediaFileDocumentData;
        return {
          id: mediaDoc.id,
          ...mediaData,
          uploadedAt: new Date(mediaData.uploadedAt),
        };
      });
      setActiveProjectMedia(fetchedMedia);
    }, (error) => {
      console.error("Firestore error fetching media for active project:", error);
      setActiveProjectMedia([]);
    });

    // Cleanup function to unsubscribe when activeProjectForMenuId changes or component unmounts
    return () => unsubscribeMedia();
  }, [activeProjectForMenuId]); // Dependes only on the active project ID

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
    minioObjectKey: string
  ): Promise<MediaFile | undefined> => {
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    const projectSnapshot = await getDoc(projectDocRef);

    if (!projectSnapshot.exists()) {
      console.error(`Project with ID ${projectId} not found.`);
      return undefined;
    }
    const projectData = projectSnapshot.data() as ProjectDocumentData;

    const minioEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT;
    const minioBucket = MINIO_BUCKET_NAME; 

    if (!minioEndpoint || !minioBucket) {
        console.error("MinIO endpoint or bucket name not configured correctly in environment variables.");
        throw new Error("MinIO configuration missing. Cannot construct media URL.");
    }
    const endpoint = minioEndpoint.endsWith('/') ? minioEndpoint.slice(0, -1) : minioEndpoint;
    const publicUrl = `${endpoint}/${minioBucket}/${minioObjectKey}`;

    const mediaId = uuidv4(); 

    const newMediaFile: MediaFile = {
      id: mediaId, 
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "video",
      url: publicUrl, 
      size: file.size,
      uploadedAt: new Date(),
      storagePath: minioObjectKey, 
    };

    const mediaDocData: MediaFileDocumentData = {
      name: newMediaFile.name,
      type: newMediaFile.type,
      url: newMediaFile.url,
      size: newMediaFile.size,
      uploadedAt: newMediaFile.uploadedAt.getTime(), 
      storagePath: newMediaFile.storagePath,
    };
    
    try {
      const mediaSubcollectionRef = collection(projectDocRef, MEDIA_SUBCOLLECTION);
      const mediaDocRef = doc(mediaSubcollectionRef, mediaId);
      await setDoc(mediaDocRef, mediaDocData);
      return newMediaFile; 
    } catch (error) {
      console.error("Error saving media metadata to Firestore:", error);
      return undefined;
    }
  }, []);
  
  const deleteMedia = useCallback(async (
    projectId: string,
    mediaId: string 
  ): Promise<void> => {
    const project = getProject(projectId);
    const mediaToDelete = project?.media.find((m) => m.id === mediaId);
    
    if (!project || !mediaToDelete || !mediaToDelete.storagePath) {
        console.error("Project or media (or its MinIO storagePath) not found for deletion.");
        throw new Error("Media information incomplete for MinIO deletion.");
    }

    if (!minioS3Client || !MINIO_BUCKET_NAME) {
        console.error("MinIO S3 client or bucket name not configured for deletion.");
        throw new Error("MinIO client/bucket not configured.");
    }

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: MINIO_BUCKET_NAME,
        Key: mediaToDelete.storagePath, 
      });
      await minioS3Client.send(deleteCommand);
      console.log(`Successfully deleted ${mediaToDelete.storagePath} from MinIO.`);

      const mediaDocRef = doc(
        firestore,
        PROJECTS_COLLECTION,
        projectId,
        MEDIA_SUBCOLLECTION,
        mediaId 
      );
      await deleteDoc(mediaDocRef);

      const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
      const projectSnapshot = await getDoc(projectDocRef);
      if(projectSnapshot.exists()){
        const projectData = projectSnapshot.data() as ProjectDocumentData;
        if (projectData.currentMediaId === mediaId) {
          const remainingMediaSnapshot = await getDocs(query(collection(projectDocRef, MEDIA_SUBCOLLECTION), orderBy("uploadedAt", "asc")));
          const newCurrentMediaId = remainingMediaSnapshot.docs.length > 0 ? remainingMediaSnapshot.docs[0].id : null;
          await updateDoc(projectDocRef, { currentMediaId: newCurrentMediaId });
        }
      }
    } catch (error) {
      console.error("Error deleting media (from MinIO or Firestore):", error);
      throw error; 
    }
  }, [getProject]);
  
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    const project = getProject(projectId);
    if (!project) {
        console.warn(`Project with ID ${projectId} not found for deletion.`);
        return;
    }

    const batch = writeBatch(firestore);
    
    const mediaCollectionRef = collection(firestore, PROJECTS_COLLECTION, projectId, MEDIA_SUBCOLLECTION);
    const mediaSnapshot = await getDocs(mediaCollectionRef);

    for (const mediaDoc of mediaSnapshot.docs) {
        const mediaData = mediaDoc.data() as MediaFileDocumentData;
        if (mediaData.storagePath && minioS3Client && MINIO_BUCKET_NAME) {
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: MINIO_BUCKET_NAME,
                    Key: mediaData.storagePath,
                });
                await minioS3Client.send(deleteCommand);
                console.log(`Successfully deleted ${mediaData.storagePath} from MinIO during project deletion.`);
            } catch (storageError) {
                console.error(`Error deleting ${mediaData.storagePath} from MinIO during project deletion:`, storageError);
            }
        }
        batch.delete(mediaDoc.ref);
    }
    
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    batch.delete(projectDocRef);

    try {
        await batch.commit();
        if (activeProjectForMenuId === projectId) {
          setActiveProjectForMenuId(null);
        }
    } catch(error) {
        console.error("Error deleting project with batch from Firestore:", error);
        throw error;
    }
  }, [getProject, activeProjectForMenuId]);

  const setCurrentMediaForProject = useCallback(async (
    projectId: string,
    mediaId: string | null
  ): Promise<void> => {
    const projectDocRef = doc(firestore, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectDocRef, { currentMediaId: mediaId });
  }, []);

  const setActiveProjectForMenu = useCallback((projectId: string | null): void => {
    setActiveProjectForMenuId(projectId);
  }, []);
  
  const updateDisplayForInstance = useCallback(async (
    targetInstancePin: string,
    projectId: string,
    mediaId: string | null
  ): Promise<void> => {
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
  }, []);

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
    const instanceDocRef = doc(firestore, INSTANCE_DISPLAY_STATE_COLLECTION, pin);
    await deleteDoc(instanceDocRef);
  }, []);
  
  const activeProjectForMenu = projects.find((p) => p.id === activeProjectForMenuId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        instanceProjects,
        activeProjectForMenu,
        activeProjectMedia, // Added active project media to context value
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
        getAllInstanceDisplayStates,
        clearInstanceDisplayState,
        deleteInstanceDisplayStateFromAdmin,
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
