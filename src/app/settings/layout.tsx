"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Bell, Globe, Palette, Users, Building, Settings as SettingsIcon, Link as LinkIcon } from "lucide-react";
import { AppShell } from "@/components/layout";
import { cn } from "@/lib/utils";

const personalSettings = [
  { id: "profile", label: "Profile", icon: User, href: "/settings/profile" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/settings/notifications" },
  { id: "language", label: "Language", icon: Globe, href: "/settings/language" },
  { id: "display", label: "Display", icon: Palette, href: "/settings/display" },
];

const adminSettings = [
  { id: "users", label: "Users", icon: Users, href: "/settings/users" },
  { id: "company", label: "Company", icon: Building, href: "/settings/company" },
  { id: "config", label: "Configuration", icon: SettingsIcon, href: "/settings" },
  { id: "integrations", label: "Integrations", icon: LinkIcon, href: "/settings/integrations" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname.startsWith(href);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-6">
            {/* Personal Settings */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Personal
              </h3>
              <div className="space-y-1">
                {personalSettings.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Admin Settings */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Admin
              </h3>
              <div className="space-y-1">
                {adminSettings.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </AppShell>
  );
}
