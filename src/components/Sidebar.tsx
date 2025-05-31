"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Tv2,
  Smartphone,
  Info,
  ShieldCheck,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "./SiteLogo";

// Define navigation items for Media Remote
const navItems: Array<{ name: string; href: string; icon: React.ElementType; target?: string; badge?: string }> = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects-overview", icon: FolderKanban },
  { name: "Device Display", href: "/display", icon: Tv2, target: "_blank" },
  { name: "Remote Control", href: "/remote/select-project", icon: Smartphone },
  { name: "About", href: "/about", icon: Info },
];

const footerNavItems: Array<{ name: string; href: string; icon: React.ElementType; description?: string }> = [
  { name: "Admin Panel", href: "/admin", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggle}
      />
      {/* Sidebar proper: Using 'aside' for semantic HTML and 'bg-sidebar' from globals.css */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground",
          "transition-transform duration-300 ease-in-out",
          "border-r border-sidebar-border", 
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <SiteLogo />
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={toggle}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        <div className="flex flex-col h-[calc(100vh-3.5rem)]"> {/* Full height minus header */}
          <div className="flex-1 overflow-auto py-2 no-scrollbar"> {/* Scrollable main nav */}
            <nav className="grid gap-1 px-2">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  target={item.target}
                  rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", 
                    pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => { if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) toggle(); }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.625rem] font-medium text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          {/* Footer Nav */}
          <div className="border-t border-sidebar-border p-2"> 
            <nav className="grid gap-1">
              {footerNavItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", 
                    pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground" 
                  )}
                  onClick={() => { if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) toggle(); }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.description && (
                        <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}