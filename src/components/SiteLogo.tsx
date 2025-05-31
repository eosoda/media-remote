
import { MonitorPlay } from "lucide-react";
import Link from "next/link";

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary mr-4 md:mr-6">
      <MonitorPlay className="h-7 w-7 shrink-0" />
      <span className="truncate">Media Remote</span>
    </Link>
  );
}
