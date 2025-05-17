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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, LogIn } from "lucide-react";

const pinFormSchema = z.object({
  pin: z.string().length(6, "PIN must be 6 digits").regex(/^\d{6}$/, "PIN must be 6 digits"),
});

type PinFormValues = z.infer<typeof pinFormSchema>;

interface PinEntryFormProps {
  onSubmitPin: (pin: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function PinEntryForm({ onSubmitPin, isLoading = false, errorMessage }: PinEntryFormProps) {
  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      pin: "",
    },
  });

  const handleSubmit = (data: PinFormValues) => {
    onSubmitPin(data.pin);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <KeyRound className="mr-2 h-6 w-6 text-primary" /> Enter Display&apos;s Instance PIN
        </CardTitle>
        <CardDescription>
          Enter the 6-digit PIN shown on the browser instance you want to control. 
          This PIN is usually found on its main projects page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display&apos;s Instance PIN</FormLabel>
                  <FormControl>
                    <Input
                      type="password" // Keeps it masked, but user might prefer text
                      maxLength={6}
                      placeholder="••••••"
                      {...field}
                      className="text-center text-lg tracking-[0.3em]"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Verifying..." : <><LogIn className="mr-2 h-4 w-4"/>Connect to Display</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
