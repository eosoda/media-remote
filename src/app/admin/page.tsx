
"use client";

import { AdminProjectTable } from "@/components/admin/AdminProjectTable";
import { AdminInstanceTable } from "@/components/admin/AdminInstanceTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, FolderGit2, RadioTower } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { setActiveProjectForMenu } = useProjects();

  useEffect(() => {
    setActiveProjectForMenu(null);
    document.title = "Admin Panel - Media Remote";
  }, [setActiveProjectForMenu]);

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!adminPass) {
      setIsAuthenticated(true);
    } else {
        // Check if previously authenticated (e.g. from session storage or context for a more robust solution)
        // For this example, if a password is set, require re-authentication each time unless you implement session persistence.
        // To keep it simple as per current logic:
        // if (localStorage.getItem("isAdminAuthenticated") === "true" && adminPass) {
        //   setIsAuthenticated(true); // Example if you had session persistence
        // }
    }
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "1234";
    if (password === adminPass) {
      setIsAuthenticated(true);
      // if (typeof window !== "undefined") localStorage.setItem("isAdminAuthenticated", "true"); // Example for session persistence
    } else {
      alert("Incorrect password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Admin Panel Access</CardTitle>
            <CardDescription>Please enter the admin password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                className="text-center"
              />
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
      </div>
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects"><FolderGit2 className="mr-2 h-4 w-4" /> Project Management</TabsTrigger>
          <TabsTrigger value="instances"><RadioTower className="mr-2 h-4 w-4" /> Display Instances</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage All Projects</CardTitle>
              <CardDescription>View, edit, or delete any project in the system. Media for projects can also be managed here.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminProjectTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="instances" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Active Display Instances</CardTitle>
              <CardDescription>
                View active display instances (PINs), clear their current media, or remove their state.
                Deleting an instance state does not delete projects or media.
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
