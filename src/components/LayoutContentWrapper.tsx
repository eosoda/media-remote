"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React from "react";

export function LayoutContentWrapper({ children }: { children: React.ReactNode }) {
  const { isMobile, openMobile } = useSidebar();

  return (
    <div className={cn(
      "flex-1", // Allow it to grow
      isMobile && !openMobile && "w-full px-8 sm:px-10" // Full width and horizontal padding on mobile when sidebar is closed
    )}>
      {children}
    </div>
  );
}