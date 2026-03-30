
export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video";
  url: string; // URL from Cloudinary
  size: number;
  uploadedAt: Date;
  storagePath: string; // Cloudinary public_id
  thumbnailUrl?: string; // URL for video thumbnail from Cloudinary
  thumbnailStoragePath?: string; // Cloudinary public_id for video thumbnail
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
  defaultDisplayBackgroundStoragePath?: string; // Cloudinary public_id
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
  defaultDisplayBackgroundStoragePath?: string; // Cloudinary public_id
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
