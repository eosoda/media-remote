# **App Name**: Media Remote

## Core Features:

- Project Management: Create and manage projects with a name, identifier, media folder, and current media selection.
- Media Upload and Management: Enable the upload of images (JPG, PNG, GIF, WebP) and videos (MP4, WebM) with thumbnail previews and deletion options via the desktop GUI.
- Fullscreen Media Display: Open a new fullscreen window to display the currently selected media from the project. If no media is selected, display the first media in the list. Automatically refresh (poll every 2 seconds) to reflect changes made via the web controller.
- Web-Based Remote Control: Host a web server accessible via http://<IP-local>:8000, to remotely control the media. Display existing projects and media galleries for project selection and media activation.
- About page: A simple page with information about what is currently displayed, along with a description of how to use the remote control and how to find the desktop application.

## Style Guidelines:

- Primary color: Use a calm blue (#42A5F5) to create a sense of trust and stability.
- Secondary color: Light gray (#EEEEEE) for backgrounds to provide a clean and modern look.
- Accent: Teal (#26A69A) to draw attention to interactive elements like buttons and selections.
- Use a clean, modern layout with a focus on ease of use.
- Use consistent and simple icons throughout the application for quick recognition.
- Subtle transitions for displaying media and updating the interface.