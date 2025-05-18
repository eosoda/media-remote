# Project Documentation: Media Asset Manager

This project is a Next.js application designed to manage media assets with Firebase for authentication and database, and Minio for object storage. The application provides a platform for users to upload, organize, display, and remotely control media assets within different projects.

## Project Structure and Content

The project follows a standard Next.js application structure with additional directories for specific functionalities:

- **`.idx`**: Contains development environment configurations.
- **`.vscode`**: Contains VS Code specific settings.
- **`docs`**: Contains project documentation, including the `blueprint.md` file.
- **`public`**: Contains static assets.
- **`src`**: Contains the main application source code.
    - **`ai`**: Contains files related to artificial intelligence functionalities (currently `dev.ts` and `genkit.ts`).
    - **`app`**: Contains the application's pages and layout.
        - **`[projectId]`**: Dynamic routes for project-specific pages (display and remote control).
        - **`api`**: Contains API routes (currently for Minio upload URLs).
        - **`about`**: The About page.
        - **`admin`**: The Admin page.
        - **`display`**: The main display page for media assets.
        - **`projects-overview`**: Page showing an overview of all projects.
        - **`remote`**: The remote control page for media assets.
        - **`select-project`**: Page to select a project for remote control.
        - **`favicon.ico`**: Application favicon.
        - **`globals.css`**: Global CSS styles.
        - **`layout.tsx`**: The main application layout component.
        - **`page.tsx`**: The main landing page.
    - **`components`**: Contains reusable UI components.
        - **`admin`**: Components specific to the admin page.
        - **`ui`**: Contains UI components from a UI library (shadcn/ui).
        - **`AppSidebar.tsx`**: The application sidebar component.
        - **`CreateProjectForm.tsx`**: Form for creating new projects.
        - **`LayoutContentWrapper.tsx`**: Wrapper component for layout content.
        - **`MediaDisplayComponent.tsx`**: Component for displaying media assets.
        - **`MediaGallery.tsx`**: Component for displaying a gallery of media assets.
        - **`MediaItemCard.tsx`**: Card component for individual media items.
        - **`MediaUploader.tsx`**: Component for uploading media assets.
        - **`PinEntryForm.tsx`**: Form for entering a PIN (likely for access control).
        - **`ProjectItemCard.tsx`**: Card component for individual projects.
        - **`ProjectList.tsx`**: Component for displaying a list of projects.
        - **`SiteLogo.tsx`**: The application logo component.
        - **`ThemeToggleButton.tsx`**: Button to toggle between themes.
    - **`contexts`**: Contains React context providers (currently `ProjectContext.tsx`).
    - **`hooks`**: Contains custom React hooks.
    - **`lib`**: Contains utility functions and library initializations (Firebase, Minio, general utilities).
    - **`types`**: Contains TypeScript type definitions.

## Getting Started

To get started with the project, explore the files within the `src` directory. The main entry point for the application layout is `src/app/layout.tsx`, and the main landing page is `src/app/page.tsx`. The core functionalities are implemented within the components and pages located in `src/components` and `src/app` respectively.
