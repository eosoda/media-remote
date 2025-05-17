
"use client";

import Link from "next/link";
import { Home, Info, Folder, Tv2, Smartphone, PlusCircle, ShieldCheck, LayoutDashboard, Settings } from "lucide-react"; 
import { SiteLogo } from "@/components/SiteLogo";
import { useProjects } from "@/contexts/ProjectContext";
import { usePathname } from "next/navigation";
import { ThemeToggleButton } from "./ThemeToggleButton";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator, 
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { projects } = useProjects(); 
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r"> 
      <SidebarHeader className="p-4 flex justify-start items-center"> {/* Changed justify-between to justify-start */}
        <SiteLogo />
        {/* Desktop toggle button removed from here */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="pl-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/"}
              tooltip="Dashboard"
            >
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/projects-overview"}
              tooltip="Manage Projects"
            >
              <Link href="/projects-overview">
                <Settings />
                <span>Manage Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/about"}
              tooltip="About"
            >
              <Link href="/about">
                <Info />
                <span>About</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin"}
              tooltip="Admin Panel"
            >
              <Link href="/admin">
                <ShieldCheck />
                <span>Admin Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-4" />
        
        <SidebarMenu className="pl-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/display"}
              tooltip="Open This Device's Display"
            >
              <Link href="/display" target="_blank" rel="noopener noreferrer">
                <Tv2 />
                <span>This Device's Display</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/remote")}
              tooltip="Remote Control"
            >
              <Link href="/remote/select-project">
                <Smartphone />
                <span>Remote Control</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {projects.length > 0 && (
           <div className="px-4 py-2 text-sm text-muted-foreground group-data-[state=collapsed]:hidden">
             
          </div>
        )}

      </SidebarContent>
      <SidebarFooter className="p-2">
        <ThemeToggleButton />
      </SidebarFooter>
    </Sidebar>
  );
}
