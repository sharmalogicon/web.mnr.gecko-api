"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { users as seedUsers, type UserRecord, type UserRole } from "@/data/seed/users";

const ROUTE = "/settings/users";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  rawRole: UserRole;
  status: "active" | "inactive";
  initials: string;
  avatar: string;
}

const ROLE_LABEL: Record<UserRole, string> = {
  surveyor: "Surveyor",
  estimator: "Estimator",
  approver: "Approver",
  depot_manager: "Manager",
  finance: "Finance",
  admin: "Admin",
  read_only: "Read-only",
};

function toRow(rec: UserRecord): UserRow {
  const initials = rec.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return {
    id: rec.id,
    name: rec.name,
    email: rec.email,
    role: ROLE_LABEL[rec.role],
    rawRole: rec.role,
    status: rec.status === "active" ? "active" : "inactive",
    initials,
    avatar: "",
  };
}

const userRows: UserRow[] = seedUsers.map(toRow);

const roleStyles: Record<string, React.CSSProperties> = {
  Admin:     { background: "var(--gecko-accent-100)",  color: "var(--gecko-accent-700)" },
  Approver:  { background: "var(--gecko-primary-100)", color: "var(--gecko-primary-700)" },
  Manager:   { background: "var(--gecko-primary-100)", color: "var(--gecko-primary-700)" },
  Surveyor:  { background: "var(--gecko-success-100)", color: "var(--gecko-success-700)" },
  Estimator: { background: "var(--gecko-info-100)",    color: "var(--gecko-info-700)" },
  Finance:   { background: "var(--gecko-warning-100)", color: "var(--gecko-warning-700)" },
  "Read-only": { background: "var(--gecko-gray-100)",  color: "var(--gecko-gray-700)" },
};

export default function UsersSettingsPage() {
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : userRows;
  const hasActiveFilters = !!searchQuery || roleFilter !== "all" || statusFilter !== "all";

  const filteredUsers = records.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = async () => {
    setIsInviting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsInviting(false);
    setIsInviteOpen(false);
  };

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  // Settings layout already provides AppShell — render bare branches here.
  if (forceLoading) {
    return <TableSkeleton columns={5} rows={6} />;
  }
  if (forceError) {
    const errCopy = getErrorCopy(ROUTE);
    return (
      <ErrorState
        title={errCopy.title}
        description={errCopy.description}
        onRetry={() => window.location.reload()}
      />
    );
  }
  const showFilterEmpty = forceFilterEmpty || (filteredUsers.length === 0 && hasActiveFilters);
  const showEmpty       = forceEmpty       || (records.length === 0 && !hasActiveFilters);
  if (showFilterEmpty || showEmpty) {
    const variant: EmptyStateVariant = showFilterEmpty ? "filter-empty" : "empty";
    const copy = getEmptyCopy(ROUTE, variant) ?? getEmptyCopy(ROUTE, "empty");
    if (copy) {
      return (
        <EmptyState
          variant={variant}
          icon={copy.icon}
          title={copy.title}
          description={copy.description}
          primary={copy.primary}
          secondary={copy.secondary}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users and their permissions</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="plus" size={16} className="mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new user to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address *</Label>
                <Input id="inviteEmail" type="email" placeholder="newuser@gecko-mnr.example" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Role *</Label>
                <Select defaultValue="surveyor">
                  <SelectTrigger id="inviteRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                    <SelectItem value="surveyor">Surveyor</SelectItem>
                    <SelectItem value="estimator">Estimator</SelectItem>
                    <SelectItem value="depot_manager">Depot Manager</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteLang">Preferred Language</Label>
                <Select defaultValue="th">
                  <SelectTrigger id="inviteLang">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{"\u{1F1FA}\u{1F1F8}"} English</SelectItem>
                    <SelectItem value="th">{"\u{1F1F9}\u{1F1ED}"} Thai</SelectItem>
                    <SelectItem value="vi">{"\u{1F1FB}\u{1F1F3}"} Vietnamese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="sendWelcome" defaultChecked />
                <Label htmlFor="sendWelcome" className="text-sm">
                  Send welcome email
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting ? (
                  <>
                    <span className="gecko-spinner gecko-spinner-sm gecko-spinner-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon name="mail" size={16} className="mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="approver">Approver</SelectItem>
              <SelectItem value="surveyor">Surveyor</SelectItem>
              <SelectItem value="estimator">Estimator</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm">User</th>
                  <th className="text-left p-4 font-medium text-sm hidden sm:table-cell">Email</th>
                  <th className="text-left p-4 font-medium text-sm">Role</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-right p-4 font-medium text-sm w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" style={roleStyles[user.role]}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Icon name="moreHorizontal" size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "active" ? (
                            <DropdownMenuItem
                              style={{ color: "var(--gecko-warning-700)" }}
                            >
                              Deactivate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              style={{ color: "var(--gecko-success-700)" }}
                            >
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            style={{ color: "var(--gecko-error-700)" }}
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-{filteredUsers.length} of {userRows.length} users
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Icon name="chevronLeft" size={16} className="mr-1" />
            Prev
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
            <Icon name="chevronRight" size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
