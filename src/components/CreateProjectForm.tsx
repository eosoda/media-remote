
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Project name is too long"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectFormProps {
  onProjectCreated?: (projectId: string) => void;
  className?: string;
}

export function CreateProjectForm({ onProjectCreated, className }: CreateProjectFormProps) {
  const { addProject, instancePin: currentInstancePin, getOrCreateInstancePin } = useProjects();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [effectiveInstancePin, setEffectiveInstancePin] = useState<string | null>(currentInstancePin);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (!currentInstancePin) {
      const pin = getOrCreateInstancePin();
      setEffectiveInstancePin(pin);
    } else {
      setEffectiveInstancePin(currentInstancePin);
    }
  }, [currentInstancePin, getOrCreateInstancePin]);

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    if (!effectiveInstancePin) {
      toast({
        title: "Error",
        description: "Cannot create project: Device instance PIN not available. Please refresh.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Removed defaultDisplayBackground from here
      const newProject = await addProject(data.name, effectiveInstancePin);
      if (newProject) {
        toast({
          title: "Project Created",
          description: `Project "${newProject.name}" has been successfully created for this device instance.`,
        });
        form.reset();
        if (onProjectCreated) {
          onProjectCreated(newProject.id);
        } else {
          router.push(`/projects/${newProject.id}`);
        }
      } else {
        throw new Error("Project creation returned null or failed.");
      }
    } catch (error) {
      toast({
        title: "Error Creating Project",
        description: (error instanceof Error && error.message) || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Summer Vacation Slideshow"
                      {...field}
                      disabled={isSubmitting || !effectiveInstancePin}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || !effectiveInstancePin} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
            {!effectiveInstancePin && <p className="text-xs text-muted-foreground text-center">Initializing device instance...</p>}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
