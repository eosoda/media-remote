
import { MonitorPlay } from "lucide-react";
import Link from "next/link";

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
      <MonitorPlay className="h-7 w-7 shrink-0" /> {/* Ensure icon doesn't shrink */}
      {/* The 'group' class is on the parent Sidebar component in AppSidebar.tsx */}
      {/* This span will hide when the Sidebar's data-state is 'collapsed' */}
      <span className="group-data-[state=collapsed]:hidden truncate">Media Remote</span>
    </Link>
  );
}
