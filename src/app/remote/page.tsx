
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/contexts/ProjectContext'; // Import useProjects
import { Loader2 } from 'lucide-react';

export default function RemoteRedirectPage() {
  const router = useRouter();
  const { setActiveProjectForMenu } = useProjects(); // Get setActiveProjectForMenu

  useEffect(() => {
    // Ensure no project is marked as active in the sidebar when on this redirect page
    // or before landing on the select-project page.
    setActiveProjectForMenu(null);
    router.replace('/remote/select-project');
  }, [router, setActiveProjectForMenu]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Redirecting to project selection...</p>
    </div>
  );
}
