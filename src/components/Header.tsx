"use client"

import { useSidebar } from "./SidebarProvider" 
import { Menu } from "lucide-react" // Removed User icon import
import { Button } from "@/components/ui/button"
// DropdownMenu related imports removed
import { ThemeToggleButton } from "./ThemeToggleButton";

export function Header() {
  const { toggle } = useSidebar()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggle}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Search input and form removed */}
        <div className="flex-1">
          {/* This div is kept to allow other elements to push to the right */}
        </div>

        <ThemeToggleButton />

        {/* Notifications button removed */}

        {/* User menu DropdownMenu removed */}
      </div>
    </header>
  )
}
