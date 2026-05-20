"use client";

/**
 * /settings/users — Phase 7.9-E native gecko form primitives.
 * Keeps shadcn Dialog/DropdownMenu (radix shells) and Avatar — only the
 * Input/Select/Label/Checkbox + inline styles are migrated.
 * Phase 7.13-C3 — wrapped in <ListPageShell>.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { userRepo } from "@/lib/repos";
import type { UserRecord, UserRole } from "@/lib/types";

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

const userRows: UserRow[] = userRepo.list().map(toRow);

const ROLE_PILL_CLASS: Record<string, string> = {
  Admin: "gecko-pill gecko-pill-violet",
  Approver: "gecko-pill gecko-pill-primary",
  Manager: "gecko-pill gecko-pill-primary",
  Surveyor: "gecko-pill gecko-pill-success",
  Estimator: "gecko-pill gecko-pill-info",
  Finance: "gecko-pill gecko-pill-warning",
  "Read-only": "gecko-pill gecko-pill-neutral",
};

export default function UsersSettingsPage() {
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

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

  const inviteDialog = (
    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
      <DialogTrigger asChild>
        <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
          <Icon name="plus" size={16} />
          Invite User
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new user to your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="gecko-field">
            <label htmlFor="inviteEmail" className="gecko-field-label">
              Email Address <span className="gecko-field-required">*</span>
            </label>
            <input
              id="inviteEmail"
              type="email"
              className="gecko-input"
              placeholder="newuser@gecko-mnr.example"
            />
          </div>
          <div className="gecko-field">
            <label htmlFor="inviteRole" className="gecko-field-label">
              Role <span className="gecko-field-required">*</span>
            </label>
            <select id="inviteRole" className="gecko-select" defaultValue="surveyor">
              <option value="admin">Admin</option>
              <option value="approver">Approver</option>
              <option value="surveyor">Surveyor</option>
              <option value="estimator">Estimator</option>
              <option value="depot_manager">Depot Manager</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          <div className="gecko-field">
            <label htmlFor="inviteLang" className="gecko-field-label">Preferred Language</label>
            <select id="inviteLang" className="gecko-select" defaultValue="th">
              <option value="en">🇺🇸 English</option>
              <option value="th">🇹🇭 Thai</option>
              <option value="vi">🇻🇳 Vietnamese</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" id="sendWelcome" defaultChecked />
            <span className="gecko-field-label">Send welcome email</span>
          </label>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setIsInviteOpen(false)}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={isInviting}
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            {isInviting ? (
              <>
                <span className="gecko-spinner gecko-spinner-sm gecko-spinner-white" />
                Sending...
              </>
            ) : (
              <>
                <Icon name="mail" size={16} />
                Send Invite
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <ListPageShell
      title="Users"
      count={userRows.length}
      countSuffix="users"
      subtitle="Manage users and their permissions."
      primaryAction={inviteDialog}
    >
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            placeholder="Search users..."
            className="gecko-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="gecko-select w-[140px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="approver">Approver</option>
            <option value="surveyor">Surveyor</option>
            <option value="estimator">Estimator</option>
            <option value="manager">Manager</option>
            <option value="finance">Finance</option>
          </select>
          <select
            className="gecko-select w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="gecko-card">
        <div className="gecko-card-body p-0">
          <div className="overflow-x-auto">
            <table className="gecko-table gecko-table-comfortable">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="gecko-field-label">{user.name}</p>
                          <p className="gecko-field-helper sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="gecko-field-helper">{user.email}</span>
                    </td>
                    <td>
                      <span className={ROLE_PILL_CLASS[user.role] ?? "gecko-pill gecko-pill-neutral"}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.status === "active"
                            ? "gecko-pill gecko-pill-success"
                            : "gecko-pill gecko-pill-neutral"
                        }
                      >
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm" aria-label="User actions">
                            <Icon name="moreHorizontal" size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "active" ? (
                            <DropdownMenuItem className="gecko-text-warning">
                              Deactivate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="gecko-text-success">
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gecko-text-danger">
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
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="gecko-field-helper">
          Showing 1-{filteredUsers.length} of {userRows.length} users
        </p>
        <div className="flex items-center gap-2">
          <button type="button" disabled className="gecko-btn gecko-btn-outline gecko-btn-sm">
            <Icon name="chevronLeft" size={16} />
            Prev
          </button>
          <button type="button" disabled className="gecko-btn gecko-btn-outline gecko-btn-sm">
            Next
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
    </ListPageShell>
  );
}
