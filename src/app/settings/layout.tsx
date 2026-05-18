"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Palette, Building, Link as LinkIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { cn } from "@/lib/utils";

// Use render-thunks so the gecko Icon component (size-by-prop) and lucide icons
// (size-by-className) live side-by-side until Palette/Building/LinkIcon glyphs
// land in @/components/ui/Icon.
type NavItem = {
  id: string;
  label: string;
  href: string;
  render: (cls: string) => React.ReactNode;
};

const personalSettings: NavItem[] = [
  { id: "profile",       label: "Profile",       href: "/settings/profile",       render: (cls) => <Icon name="user" size={16} className={cls} /> },
  { id: "notifications", label: "Notifications", href: "/settings/notifications", render: (cls) => <Icon name="bell" size={16} className={cls} /> },
  { id: "language",      label: "Language",      href: "/settings/language",      render: (cls) => <Icon name="globe" size={16} className={cls} /> },
  // Palette has no equivalent in @/components/ui/Icon yet — kept on lucide.
  { id: "display",       label: "Display",       href: "/settings/display",       render: (cls) => <Palette className={cn("h-4 w-4", cls)} /> },
];

const adminSettings: NavItem[] = [
  { id: "users",        label: "Users",         href: "/settings/users",        render: (cls) => <Icon name="users" size={16} className={cls} /> },
  // Building has no equivalent — kept on lucide.
  { id: "company",      label: "Company",       href: "/settings/company",      render: (cls) => <Building className={cn("h-4 w-4", cls)} /> },
  { id: "config",       label: "Configuration", href: "/settings",              render: (cls) => <Icon name="settings" size={16} className={cls} /> },
  // LinkIcon has no equivalent — kept on lucide.
  { id: "integrations", label: "Integrations",  href: "/settings/integrations", render: (cls) => <LinkIcon className={cn("h-4 w-4", cls)} /> },
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
                {personalSettings.map((item) => (
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
                    {item.render("")}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin Settings */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Admin
              </h3>
              <div className="space-y-1">
                {adminSettings.map((item) => (
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
                    {item.render("")}
                    {item.label}
                  </Link>
                ))}
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
