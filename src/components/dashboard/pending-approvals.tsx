"use client";

import { Wrench, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Approval {
  id: string;
  type: "repair" | "modification";
  reference: string;
  equipment: string;
  customer: string;
  amount: string;
  waitingTime: string;
}

const pendingApprovals: Approval[] = [
  {
    id: "1",
    type: "repair",
    reference: "REP-001234",
    equipment: "MSKU2234567",
    customer: "CMA CGM",
    amount: "฿84,000",
    waitingTime: "2 days",
  },
  {
    id: "2",
    type: "modification",
    reference: "MOD-000456",
    equipment: "TCLU9987654",
    customer: "MSC",
    amount: "฿64,750",
    waitingTime: "1 day",
  },
  {
    id: "3",
    type: "repair",
    reference: "REP-001235",
    equipment: "REEF4455667",
    customer: "Hapag-Lloyd",
    amount: "฿22,750",
    waitingTime: "4 hours",
  },
];

const typeConfig = {
  repair: { icon: Wrench, label: "Repair Quote" },
  modification: { icon: Settings2, label: "Modification" },
};

export function PendingApprovals() {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="gecko-card-title">Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">
            {pendingApprovals.length} items awaiting review
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/approvals">View All</Link>
        </Button>
      </div>
      <div className="divide-y">
        {pendingApprovals.map((approval) => {
          const config = typeConfig[approval.type];
          const Icon = config.icon;

          return (
            <div key={approval.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {config.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {approval.reference}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {approval.equipment} - {approval.customer}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Waiting: {approval.waitingTime}
                    </p>
                  </div>
                </div>
                <span className="gecko-card-title gecko-text-sm">{approval.amount}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Reject
                </Button>
                <Button size="sm" className="flex-1">
                  Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
