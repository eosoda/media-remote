
"use client";

import * as React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggleButton() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const renderTriggerButton = () => {
    const iconProps = { className: "h-[1.2rem] w-[1.2rem]" };
    let CurrentIconComponent;
    let srText = "Toggle theme";

    if (!mounted) {
      // Render a placeholder or default icon until mounted to avoid hydration mismatch
      CurrentIconComponent = Laptop; // Default to system icon or a generic theme icon
      srText = "Toggle theme (loading)";
    } else {
      if (theme === 'dark') {
        CurrentIconComponent = Moon;
      } else if (theme === 'light') {
        CurrentIconComponent = Sun;
      } else {
        CurrentIconComponent = Laptop;
      }
    }

    return (
      <Button variant="outline" size="icon" disabled={!mounted}>
        <CurrentIconComponent {...iconProps} />
        <span className="sr-only">{srText}</span>
      </Button>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {renderTriggerButton()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
