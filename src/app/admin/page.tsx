"use client";

import { AdminProjectTable } from "@/components/admin/AdminProjectTable";
import { AdminInstanceTable } from "@/components/admin/AdminInstanceTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, FolderGit2, RadioTower } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useEffect } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const { setActiveProjectForMenu } = useProjects();

  useEffect(() => {
    setActiveProjectForMenu(null); // Ensure no project is active in sidebar for admin page
  }, [setActiveProjectForMenu]);

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (!isAuthenticated || !process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
  return (
   <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <form onSubmit={handlePasswordSubmit} className="flex flex-col space-y-4">
          <h2 className="text-2xl font-semibold">Enter Admin Password</h2>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange} />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Submit
          </button>
        </form>
      </Tabs>
    </div>
  );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
      </div>
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="projects"><FolderGit2 className="mr-2 h-4 w-4" /> Project Management</TabsTrigger>
          <TabsTrigger value="instances"><RadioTower className="mr-2 h-4 w-4" /> Display Instances</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Manage Projects</CardTitle>
              <CardDescription>Edit, delete, and manage media for all projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminProjectTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="instances">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Manage Active Display Instances (PINs)</CardTitle>
              <CardDescription>
                View active display instances, clear their current media, or remove their state.
                Deleting an instance state here does not delete projects or media.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminInstanceTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
