
"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy, Info, Loader2, Smartphone, FolderKanban, Tv2, Settings2 } from "lucide-react";

import { useProjects } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function HomePage() {
  const { getOrCreateInstancePin, isLoading: projectsLoading, setActiveProjectForMenu} = useProjects();
  const { toast } = useToast();
  const [currentInstancePin, setCurrentInstancePin] = useState<string | null>(null);

  useEffect(() => {
    setActiveProjectForMenu(null);
    const pin = getOrCreateInstancePin();
    setCurrentInstancePin(pin);
  }, [getOrCreateInstancePin, setActiveProjectForMenu]);

  const handleCopyPin = () => {
    if (currentInstancePin) {
      navigator.clipboard.writeText(currentInstancePin)
        .then(() => {
          toast({ title: "Instance PIN Copied!", description: "This browser's instance PIN copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy PIN.", variant: "destructive" });
          console.error('Failed to copy PIN: ', err);
        });
    }
  };

  return (
    <>
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Media Remote</h1>
        <p className="text-xl text-muted-foreground mt-2">Your personal solution for managing and displaying media.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><FolderKanban className="mr-3 h-7 w-7 text-primary" /> My Media Hub</CardTitle>
            <CardDescription>Organize your media, control what's playing on this device, or manage other displays.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full justify-start py-6 text-base">
              <Link href="/projects-overview">
                <Settings2 className="mr-3 h-5 w-5" /> Manage My Projects
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full justify-start py-6 text-base">
              <Link href="/display" target="_blank" rel="noopener noreferrer">
                <Tv2 className="mr-3 h-5 w-5" /> Open This Device's Display
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full justify-start py-6 text-base">
              <Link href="/remote/select-project">
                <Smartphone className="mr-3 h-5 w-5" /> Remote Control Another Display
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3"> {/* Added pb-3 for better spacing */}
            <CardTitle className="flex items-center text-2xl"><KeyRound className="mr-3 h-7 w-7 text-accent" /> This Device's Instance PIN</CardTitle>
            <CardDescription>Use this PIN on another device&apos;s remote control page to control the display from *this* browser/device if it&apos;s on the generic `/display` page.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0"> {/* Added pt-0 to remove default top padding */}
            {projectsLoading && !currentInstancePin ? (
              <div className="flex items-center text-muted-foreground p-3">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading PIN...</span>
              </div>
            ) : currentInstancePin ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md shadow-inner">
                <span className="text-3xl font-mono font-bold tracking-wider text-foreground">{currentInstancePin}</span>
                <Button variant="ghost" size="icon" onClick={handleCopyPin} title="Copy PIN&apos;">
                  <Copy className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center text-destructive p-3">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Generating PIN...</span>
              </div>
            )}
            <div className="mt-4 text-xs text-muted-foreground flex items-start">
              <Info className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0" />
              <span>This PIN is unique to this browser instance and typically expires in 24 hours. It allows a remote to control what&apos;s shown on this browser&apos;s generic `/display` page.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
