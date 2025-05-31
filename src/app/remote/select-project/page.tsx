
import { Suspense } from 'react';
import SelectProjectForRemoteContent from '@/components/remote/SelectProjectForRemoteContent';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <KeyRound className="mr-2 h-6 w-6 text-primary" /> Loading Options...
          </CardTitle>
          <CardDescription>
            Please wait while we load the remote control options.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SelectProjectForRemotePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SelectProjectForRemoteContent />
    </Suspense>
  );
}
