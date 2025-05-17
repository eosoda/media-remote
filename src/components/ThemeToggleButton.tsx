
"use client";

import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggleButton() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getTooltipText = () => {
    if (theme === 'light') return "Switch to Dark Mode";
    if (theme === 'dark') return "Switch to System Preference";
    return "Switch to Light Mode";
  };
  
  const getIcon = () => {
    if (theme === 'system') {
        return <Laptop className="h-5 w-5" />;
    }
    if (effectiveTheme === 'dark') {
        return <Moon className="h-5 w-5" />;
    }
    return <Sun className="h-5 w-5" />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          aria-label={getTooltipText()}
          className="w-full justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8"
        >
          {getIcon()}
          <span className="sr-only">{getTooltipText()}</span>
           <span className="ml-2 group-data-[collapsible=icon]:hidden">
            {theme === 'light' && 'Light'}
            {theme === 'dark' && 'Dark'}
            {theme === 'system' && `System (${effectiveTheme})`}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <p>{getTooltipText()}</p>
        {theme === 'system' && <p className="text-xs text-muted-foreground">(Currently: {effectiveTheme})</p>}
      </TooltipContent>
    </Tooltip>
  );
}
