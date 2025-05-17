
import { MonitorPlay } from "lucide-react";
import Link from "next/link";

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
      <MonitorPlay className="h-7 w-7" />
      <span>Media Remote</span>
    </Link>
  );
}

