
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { ProjectProvider } from "@/contexts/ProjectContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import new layout components
import { SidebarProvider } from "@/components/SidebarProvider"; 
import { Sidebar } from "@/components/Sidebar"; 
import { Header } from "@/components/Header"; 

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Media Remote Dashboard", // Updated title
  description: "Manage and display your media remotely with a new look.", // Updated description
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" 
          enableSystem
          storageKey="media-remote-theme-v3" 
        >
          <ProjectProvider>
            <TooltipProvider delayDuration={0}>
              <SidebarProvider> {/* Wrap with SidebarProvider */}
                <div className="min-h-screen bg-background">
                  <Sidebar /> {/* Render the Sidebar */}
                  <div className="lg:pl-72"> {/* Adjust content for sidebar width */}
                    <Header /> {/* Render the Header */}
                    <main className="p-4 md:p-6 lg:p-8">{children}</main>
                  </div>
                </div>
              </SidebarProvider>
              <Toaster />
            </TooltipProvider>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
