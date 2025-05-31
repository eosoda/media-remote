
// Placeholder for RecentTransactions component
// In Sambo this was called RecentTransactions, we can adapt it to "Recent Activity" for Media Remote
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentTransactions() { // Renaming to RecentActivity or similar might be better
  const activities = [
    { user: "Olivia Martin", action: "Created Project 'Summer Trip'", change: "+$1,999.00" },
    { user: "Jackson Lee", action: "Uploaded 'beach.mp4'", change: "+$39.00" },
    { user: "Isabella Nguyen", action: "Set 'sunset.jpg' as active", change: "-$299.00" },
    { user: "William Kim", action: "Deleted Project 'Old Presentation'", change: "+$99.00" },
    { user: "Sofia Davis", action: "Opened Remote for 'Conference'", change: "+$39.00" },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            {/* Placeholder avatar image or use initials */}
            <AvatarImage src={`https://placehold.co/40x40.png?text=${activity.user.substring(0,1)}`} alt="Avatar" data-ai-hint="people person" />
            <AvatarFallback>{activity.user.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.user}</p>
            <p className="text-sm text-muted-foreground">{activity.action}</p>
          </div>
          {/* <div className="ml-auto font-medium">{activity.change}</div> */}
        </div>
      ))}
    </div>
  );
}
