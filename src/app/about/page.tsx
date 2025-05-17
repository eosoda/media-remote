
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, MonitorPlay, Smartphone, Tv2, UploadCloud, FolderOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <MonitorPlay className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">Media Remote</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Your personal solution for managing and displaying local media with remote control capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center"><Info className="h-6 w-6 mr-2 text-accent" />What is This?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Media Remote is a web application designed to help you organize your images and videos into projects.
              You can then easily display your selected media, for example, on a large screen or projector, and control the playback
              from another device like your phone or tablet using the web-based remote.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center"><FolderOpen className="h-6 w-6 mr-2 text-accent" />How to Use</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <h3 className="font-medium text-foreground">Create a Project:</h3>
                  <p>Start by creating a new project from the Home page. Give it a memorable name.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <h3 className="font-medium text-foreground"><UploadCloud className="inline h-5 w-5 mr-1" /> Upload Media:</h3>
                  <p>Once a project is created, navigate to its page and upload your images (JPG, PNG, GIF, WebP) and videos (MP4, WebM).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <h3 className="font-medium text-foreground"><Tv2 className="inline h-5 w-5 mr-1" /> Display Media:&quot;</h3>
                  <p>Open the &quot;Display&quot; page for your project. This page will show the currently active media. If no media is active, it usually shows the first item.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <h3 className="font-medium text-foreground"><Smartphone className="inline h-5 w-5 mr-1" /> Remote Control:</h3>
                  <p>Open the &quot;Remote&quot; page for the same project on another device (or another browser tab). Clicking on any media item in the remote gallery will update the &quot;Display&quot; page instantly.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Key Features</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Project-based Organization:</strong> Keep your media neatly organized.</li>
              <li><strong>Local Operation:</strong> Everything runs in your browser. Your files stay on your device.</li>
              <li><strong>Supported Media:</strong> Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM).</li>
              <li><strong>Responsive Design:</strong> Use it on desktop, tablet, or mobile.</li>
            </ul>
          </section>

          <section className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>&copy; {new Date().getFullYear()} Media Remote. Built with Next.js and Tailwind CSS.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
