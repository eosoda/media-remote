
export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video";
  url: string; // URL from MinIO
  size: number;
  uploadedAt: Date;
  storagePath: string; // MinIO object key
  thumbnailUrl?: string; // URL for video thumbnail from MinIO
  thumbnailStoragePath?: string; // MinIO object key for video thumbnail
  order: number; // For drag-and-drop ordering
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  media: MediaFile[];
  currentMediaId: string | null;
  createdAt: Date;
  instancePin: string; // Associate project with an instance PIN
  defaultDisplayBackground?: string; // New field: CSS color or image URL
}

export interface InstanceDisplayState {
  currentProjectId: string | null;
  currentMediaId: string | null;
  lastSeen?: number; // Optional: timestamp
}

// Firestore document representation for a Project
export interface ProjectDocumentData {
  name: string;
  slug: string;
  currentMediaId: string | null;
  createdAt: number; // Store as timestamp
  instancePin: string;
  defaultDisplayBackground?: string; // New field: CSS color or image URL
}

// Firestore document representation for MediaFile (within Project's media subcollection)
export interface MediaFileDocumentData {
  name: string;
  type: "image" | "video";
  url: string;
  size: number;
  uploadedAt: number; // Store as timestamp
  storagePath: string;
  thumbnailUrl?: string;
  thumbnailStoragePath?: string;
  order: number; // For drag-and-drop ordering
}
