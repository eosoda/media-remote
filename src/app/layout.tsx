
import { Inter, Roboto_Mono } from "next/font/google"; 
import "./globals.css";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";

const inter = Inter({ 
  variable: "--font-sans", 
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({ 
  variable: "--font-mono", 
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Media Remote</title>
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`} 
      >
        <ProjectProvider>
          <TooltipProvider delayDuration={0}>
            <SidebarProvider>
              <div className="flex min-h-screen">
                <AppSidebar />
                <SidebarRail /> {/* Added for desktop toggle */}
                <SidebarInset>
                  {/* Mobile Header with Sidebar Trigger and Logo */}
                  <div className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
                    <SiteLogo /> 
                    <SidebarTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Sidebar</span>
                      </Button>
                    </SidebarTrigger>
                  </div>
                  
                  <main className="flex-1 p-4 md:p-6 bg-background">
                    {children}
                  </main>
                </SidebarInset>
              </div>
              <Toaster />
            </SidebarProvider>
          </TooltipProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
