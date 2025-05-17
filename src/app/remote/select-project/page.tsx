"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, ArrowRight, FolderOpen, LogIn } from "lucide-react";
import { PinEntryForm } from "@/components/PinEntryForm";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation"; // Import useRouter
import { toast } from "@/hooks/use-toast";

export default function SelectProjectForRemotePage() {
  const { 
    projects, 
    isLoading, 
    setActiveProjectForMenu,
  } = useProjects();
  const router = useRouter(); // Initialize useRouter
  const { toast } = useToast(); // Get toast function from the hook
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false); // Renamed for clarity
  const [targetInstancePin, setTargetInstancePin] = useState<string | null>(null); // Store validated PIN

  useEffect(() => {
    setActiveProjectForMenu(null); 
  }, [setActiveProjectForMenu]);

  const handlePinSubmit = (pin: string) => {
    setIsVerifyingPin(true);
    setPinErrorMessage(null);
    // For now, we assume the PIN is for a valid, listening display instance.
    // Actual validation would require checking Firebase or a similar mechanism.
    // Here, we'll just accept it and let the remote page try to use it.
    if (pin && pin.length === 6 && /^\d{6}$/.test(pin)) {
      setTargetInstancePin(pin);
      toast({
        title: "Instance PIN Accepted",
        description: "You can now select a project to control for this display instance.",
      });
    } else {
      setPinErrorMessage("Invalid PIN format. Must be 6 digits.");
       toast({
        title: "Invalid PIN Format",
        description: "The PIN must be a 6-digit number.",
        variant: "destructive",
      });
    }
    setIsVerifyingPin(false);
  };

  const handleLockRemote = () => {
    setTargetInstancePin(null); // Clear the entered PIN
    setPinErrorMessage(null);
    toast({
      title: "Remote Locked",
      description: "Enter a Display's Instance PIN to connect again.",
    });
  };

  if (isLoading && projects.length === 0) { // Adjusted loading condition
     return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!targetInstancePin) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <PinEntryForm 
          onSubmitPin={handlePinSubmit} 
          isLoading={isVerifyingPin}
          errorMessage={pinErrorMessage}
        />
         {projects.length === 0 && !isLoading && ( 
            <p className="mt-6 text-center text-muted-foreground">
                No projects found. Please <Link href="/?create=true" className="underline hover:text-primary">create a project</Link> first.
            </p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto shadow-xl rounded-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">Select Project for Remote</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleLockRemote}>
              <LogIn className="mr-2 h-4 w-4 transform rotate-180" /> Change Display PIN
            </Button>
          </div>
          <CardDescription className="text-md">
            Controlling display with PIN: <span className="font-semibold">{targetInstancePin}</span>.
            Choose a project to open its remote control panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
                <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg mb-1">No Projects Found</p>
                <p>Please create a project first to be able to use the remote control.</p>
                 <Button asChild className="mt-4">
                    <Link href="/?create=true">Create New Project</Link>
                </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <Button variant="outline" size="lg" className="w-full justify-between py-6 text-lg" asChild>
                    {/* Pass targetInstancePin as a query parameter */}
                    <Link href={`/remote/${project.id}?instancePin=${targetInstancePin}`}>
                      <span>{project.name}</span>
                       <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">({project.media.length} media)</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
