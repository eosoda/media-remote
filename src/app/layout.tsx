
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from 'next-themes';
import { ProjectProvider } from "@/contexts/ProjectContext";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

import { SiteLogo } from "@/components/SiteLogo";
import { LayoutContentWrapper } from "@/components/LayoutContentWrapper";
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
        {/* Remove the custom script for theme detection */}
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}
      >
        {/* Wrap with ThemeProvider */}
        <ThemeProvider
          attribute="class" // Apply theme as a class to the html element
          defaultTheme="system" // Default theme
          enableSystem // Enable system theme detection
          storageKey="theme" // Key for storing theme in local storage
        >
          <ProjectProvider>
            <TooltipProvider delayDuration={0}>
              <SidebarProvider>
                <div className="flex min-h-screen">
                  <AppSidebar /> {/* Moved AppSidebar here */}
                  {/* Desktop Toggle */}
                  <SidebarRail /> {/* Added for desktop toggle */}
                  <SidebarInset>
                    {/* Desktop Header with Sidebar Trigger and Logo */}
                    <div className="hidden md:flex sticky top-0 z-30 h-14 items-center bg-background px-1 sm:px-2">
                      <SidebarTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <PanelLeft className="h-6 w-6" />
                        </Button>
                      </SidebarTrigger>
                    </div>
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
                    <LayoutContentWrapper> {/* Keep LayoutContentWrapper here */}
                      <main className="flex-1 p-4 md:p-6 bg-background mx-auto max-w-screen-lg">
                        {children}
                      </main>
                    </LayoutContentWrapper>
                  </SidebarInset>
                </div>
                <Toaster />
              </SidebarProvider> {/* Keep SidebarProvider here */}
            </TooltipProvider>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

