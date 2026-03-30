
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, MonitorPlay, Smartphone, Tv2, UploadCloud, FolderOpen, Database, Layers, Palette, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <MonitorPlay className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">Media Remote</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Your personal solution for managing and displaying digital media with remote control capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center"><Info className="h-6 w-6 mr-2 text-accent" />What is This?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Media Remote is a web application designed to help you organize your images and videos into projects.
              You can then easily display your selected media, for example, on a large screen or projector, and control the playback
              from another device like your phone or tablet using the web-based remote. Your media files are stored securely
              in Cloudinary, and project data along with display states are managed using Firebase Firestore.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center"><FolderOpen className="h-6 w-6 mr-2 text-accent" />How to Use</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <h3 className="font-medium text-foreground">Create a Project:</h3>
                  <p>Start by creating a new project from the Projects Overview page. Give it a memorable name. Projects are tied to your browser's instance PIN.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <h3 className="font-medium text-foreground"><UploadCloud className="inline h-5 w-5 mr-1" /> Upload Media:</h3>
                  <p>Once a project is created, navigate to its page and upload your images (JPG, PNG, GIF, WebP) and videos (MP4, WebM) to Cloudinary storage via the application.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <h3 className="font-medium text-foreground"><Tv2 className="inline h-5 w-5 mr-1" /> Display Media:</h3>
                  <p>Open the "Display" page for your project directly, or use the generic "Device Display" page (from the sidebar). The generic display will show media based on the PIN entered in the remote control.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <h3 className="font-medium text-foreground"><Smartphone className="inline h-5 w-5 mr-1" /> Remote Control:</h3>
                  <p>Open the "Remote Control" page on another device (or another browser tab). Enter the PIN of the display you wish to control. Then, select a project associated with that PIN. Clicking on any media item in the remote gallery will update the target "Display" page instantly.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Key Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Project-based Organization:</strong> Keep your media neatly organized.</li>
              <li><Database className="inline h-5 w-5 mr-1 text-accent" /> <strong>Cloud Media Storage:</strong> Securely store your media assets in Cloudinary.</li>
              <li><ShieldCheck className="inline h-5 w-5 mr-1 text-accent" /> <strong>Content Protection:</strong> Publicly displayed media is protected against unauthorized saving and right-clicking.</li>
              <li><Layers className="inline h-5 w-5 mr-1 text-accent" /> <strong>Firebase-powered State:</strong> Real-time synchronization of display states across devices using Firebase Firestore.</li>
              <li><strong>Remote Control:</strong> Manage what's displayed from anywhere with a web-enabled device.</li>
              <li><strong>Supported Media:</strong> Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM).</li>
              <li><Palette className="inline h-5 w-5 mr-1 text-accent" /> <strong>Customizable Display:</strong> Set a default background image or color for your project displays.</li>
              <li><strong>Responsive Design:</strong> Use it on desktop, tablet, or mobile.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Technology Stack</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Next.js (App Router, Server Components)</li>
              <li>React</li>
              <li>Tailwind CSS</li>
              <li>ShadCN UI Components</li>
              <li>Firebase (Firestore for database and real-time updates)</li>
              <li>Cloudinary (Robust cloud-based media storage and CDN delivery)</li>
            </ul>
          </section>

          <section className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>&copy; {new Date().getFullYear()} Media Remote. Built with Next.js, Tailwind CSS, Firebase, and Cloudinary.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
