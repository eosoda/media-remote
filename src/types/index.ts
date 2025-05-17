export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video";
  url: string; // URL from Firebase Storage
  size: number;
  uploadedAt: Date;
  storagePath: string; // Firebase Storage path
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  media: MediaFile[];
  currentMediaId: string | null;
  createdAt: Date;
  instancePin: string; // Associate project with an instance PIN
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
  // Media is a subcollection, so not directly here.
  // currentMediaId might be stored if frequently accessed, or derived.
  currentMediaId: string | null;
  createdAt: number; // Store as timestamp
  instancePin: string;
}

// Firestore document representation for MediaFile (within Project's media subcollection)
export interface MediaFileDocumentData {
  name: string;
  type: "image" | "video";
  url: string;
  size: number;
  uploadedAt: number; // Store as timestamp
  storagePath: string;
}
