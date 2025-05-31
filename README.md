
# Media Remote

Media Remote is a Next.js web application designed for managing and displaying digital media assets (images and videos) with remote control capabilities. It utilizes Firebase Firestore for real-time data synchronization and MinIO for S3-compatible object storage.

## Core Features

-   **Project Management**:
    -   Create and manage projects, each associated with a unique device instance PIN.
    -   Each project can have a name and a customizable default background for its display.
-   **Media Upload and Management**:
    -   Upload images (JPG, PNG, GIF, WebP) and videos (MP4, WebM) to MinIO storage.
    -   Automatic thumbnail generation for uploaded videos.
    -   View media in a gallery, set active media for display, and delete media.
    -   Reorder media items within a project using drag-and-drop.
-   **Fullscreen Media Display**:
    -   **Project-Specific Display**: Open a dedicated fullscreen display for a specific project.
    -   **Generic Device Display**: A display page that shows media based on the PIN entered in the remote control. It listens for changes from any remote controlling its PIN.
    -   Displays the currently selected media or the first media item if none is selected.
    -   Custom project background is shown behind the active media.
    -   Automatic video playback from the beginning when a video becomes active.
-   **Web-Based Remote Control**:
    -   Enter a target display's PIN to connect the remote.
    -   Select a project associated with the target PIN.
    -   Browse the project's media gallery and click an item to make it active on the target display screen.
-   **Admin Panel**:
    -   Protected by an optional password (configurable via `NEXT_PUBLIC_ADMIN_PASSWORD`).
    -   Manage all projects in the system (view, edit name, manage media, delete).
    -   Manage active display instances: view PINs, last seen, current media, and delete instance states (which also deletes associated projects and their media from MinIO and Firebase).
-   **About Page**: Provides information about the application, its usage, and key features.

## Style Guidelines

-   **Primary Color**: Calm blue (`#42A5F5`)
-   **Secondary Color**: Light gray (`#EEEEEE`) for backgrounds (though the app uses a more dynamic theme via ShadCN)
-   **Accent Color**: Teal (`#26A69A`)
-   Modern, clean layout with ShadCN UI components and Tailwind CSS.

## Technology Stack

-   **Frontend**:
    -   Next.js (App Router, Server Components, `next/image`)
    -   React (Functional Components, Hooks, Context API)
    -   TypeScript
-   **UI**:
    -   ShadCN UI
    -   Tailwind CSS
    -   Lucide React Icons
-   **Backend & Data Management**:
    -   Firebase Firestore (for project data, media metadata, and real-time display state synchronization)
-   **Media Storage**:
    -   MinIO (S3-compatible object storage for image and video files, including video thumbnails)
-   **AI (Optional/Placeholder)**:
    -   Genkit (Configured in `src/ai/`, though no active AI features are implemented beyond setup)

## Project Structure

The project follows a standard Next.js application structure:

-   **`public/`**: Static assets like `favicon.ico`.
-   **`src/`**: Main application source code.
    -   **`ai/`**: Genkit configuration and potential AI flows.
        -   `genkit.ts`: Initializes Genkit.
        -   `dev.ts`: Placeholder for development flows.
    -   **`app/`**: Next.js App Router pages and layouts.
        -   **`layout.tsx`**: Root layout, includes ThemeProvider, ProjectProvider, Sidebar, and Header.
        -   **`globals.css`**: Global styles and ShadCN UI theme variables.
        -   **`page.tsx`**: Dashboard/Home page.
        -   **`about/`**: About page.
        -   **`admin/`**: Admin panel page.
        -   **`api/minio/upload-url/`**: API route to generate presigned URLs for MinIO uploads.
        -   **`display/`**:
            -   `page.tsx`: Generic device display page (uses PIN).
            -   `[projectId]/page.tsx`: Project-specific display page.
        -   **`projects-overview/`**: Page to list and create projects for the current device instance.
        -   **`projects/[projectId]/`**: Page for managing a specific project (uploading media, viewing gallery).
        -   **`remote/`**: Remote control pages.
            -   `select-project/page.tsx`: Page to enter display PIN and select a project.
            -   `[projectId]/page.tsx`: Remote control interface for a specific project.
    -   **`components/`**: Reusable React components.
        -   **`ui/`**: ShadCN UI components.
        -   **`admin/`**: Components specific to the Admin Panel (`AdminProjectTable`, `AdminInstanceTable`).
        -   `CreateProjectForm.tsx`, `MediaGallery.tsx`, `MediaItemCard.tsx`, `MediaUploader.tsx`, `ProjectItemCard.tsx`, `ProjectList.tsx`, `ProjectSettingsModal.tsx`, `PinEntryForm.tsx`, `MediaDisplayComponent.tsx`.
        -   Layout components: `Header.tsx`, `Sidebar.tsx`, `SidebarProvider.tsx`, `SiteLogo.tsx`.
    -   **`contexts/`**: React Context providers.
        -   `ProjectContext.tsx`: Manages global state for projects, media, instance PINs, and Firebase/MinIO interactions.
    -   **`hooks/`**: Custom React hooks.
        -   `useAutoHide.ts`: Hook for auto-hiding UI elements.
        -   `useMobile.ts`: Hook to detect mobile viewports.
        -   `useToast.ts`: Hook for displaying toast notifications.
    -   **`lib/`**: Utility functions and library initializations.
        -   `firebase.ts`: Firebase app initialization and Firestore export.
        -   `minio.ts`: MinIO S3 client initialization.
        -   `utils.ts`: General utility functions (e.g., `cn` for Tailwind class merging).
    -   **`types/`**: TypeScript type definitions (`index.ts`).

## Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_firebase_database_url (optional if only using Firestore)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket (optional if only using MinIO for media)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# MinIO Configuration
NEXT_PUBLIC_MINIO_ENDPOINT=your_minio_endpoint (e.g., http://localhost:9000 or https://minio.example.com)
NEXT_PUBLIC_MINIO_ACCESS_KEY_ID=your_minio_access_key
NEXT_PUBLIC_MINIO_SECRET_ACCESS_KEY=your_minio_secret_key
NEXT_PUBLIC_MINIO_BUCKET_NAME=your_minio_bucket_name
NEXT_PUBLIC_MINIO_USE_SSL=false (or true if your MinIO endpoint uses HTTPS)
NEXT_PUBLIC_MINIO_REGION=us-east-1 (or your preferred region, 'us-east-1' is a common default for MinIO)

# Admin Panel (Optional)
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password (if not set, admin panel is accessible without password, default "1234" if this var is present but empty)
```

Ensure your MinIO bucket is created and has appropriate policies if needed (e.g., public read for objects if not using presigned GET URLs everywhere, though this app uses presigned PUTs and direct URLs).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd media-remote
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and populate it with your Firebase and MinIO credentials as shown above.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002` (or the port specified in `package.json`).

5.  **Build for production:**
    ```bash
    npm run build
    ```

6.  **Start the production server:**
    ```bash
    npm run start
    ```

## Available Scripts

-   `npm run dev`: Starts the Next.js development server (with Turbopack).
-   `npm run genkit:dev`: Starts Genkit in development mode (if Genkit flows are being developed).
-   `npm run genkit:watch`: Starts Genkit in watch mode.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase using Next.js's ESLint configuration.
-   `npm run typecheck`: Runs TypeScript type checking.
```