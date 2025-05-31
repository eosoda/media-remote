
"use client"

import { useEffect } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Smartphone, Tv2, ArrowRight, KeyRound, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";


export default function HomePage() {
  const { setActiveProjectForMenu, instancePin } = useProjects();
  const { toast } = useToast();

  useEffect(() => {
    setActiveProjectForMenu(null);
    document.title = "Dashboard - Media Remote";
  }, [setActiveProjectForMenu]);

  const handleCopyPin = () => {
    if (instancePin) {
      navigator.clipboard.writeText(instancePin)
        .then(() => {
          toast({ title: "Instance PIN Copied!", description: "This browser's instance PIN copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy PIN.", variant: "destructive" });
        });
    }
  };

  return (
    <div className="space-y-8"> {/* Changed from flex flex-col gap-6 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Media Remote Dashboard</h1>
        <p className="text-muted-foreground">Overview of your media projects and display instances.</p>
      </div>

      <div className="space-y-4"> {/* Added wrapper for Quick Actions section */}
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col h-full"> {/* Device PIN card */}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg"><KeyRound className="mr-3 h-5 w-5 text-primary" />Device PIN</CardTitle>
              <CardDescription className="text-sm">PIN for this browser's default display page.</CardDescription> {/* Changed text-xs to text-sm */}
            </CardHeader>
            <CardContent className="space-y-2 flex flex-col flex-grow">
              {instancePin ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <span className="text-2xl font-mono font-bold tracking-wider text-foreground">{instancePin}</span>
                  <Button variant="ghost" size="icon" onClick={handleCopyPin} title="Copy PIN">
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                 <div className="flex items-center justify-center text-muted-foreground p-3 bg-muted/50 rounded-md h-[52px]">
                  <span>Loading PIN...</span>
                </div>
              )}
               <Button asChild size="sm" className="w-full mt-auto">
                <Link href="/display" target="_blank" rel="noopener noreferrer">
                  <span className="flex items-center justify-center w-full"> {/* Ensure span takes full width for justify-center */}
                    <Tv2 className="mr-2 h-4 w-4"/> Open This Device's Display
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col h-full"> {/* Manage Projects card */}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg"><FolderKanban className="mr-3 h-5 w-5 text-primary" />Manage Projects</CardTitle>
              <CardDescription className="text-sm">Create, view, and upload media to your projects.</CardDescription> {/* Changed text-xs to text-sm */}
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <Button asChild className="w-full mt-auto">
                <Link href="/projects-overview">
                  <span className="flex items-center justify-center w-full">
                    Go to My Projects <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full"> {/* Remote Control card */}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg"><Smartphone className="mr-3 h-5 w-5 text-primary" />Remote Control</CardTitle>
              <CardDescription className="text-sm">Control a display instance using its PIN.</CardDescription> {/* Changed text-xs to text-sm */}
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link href="/remote/select-project">
                  <span className="flex items-center justify-center w-full">
                    Open Remote Control <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
