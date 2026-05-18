"use client";

import { useState } from "react";
import { Clock, Download } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PriceChange {
  id: string;
  dateTime: string;
  change: string;
  details: string;
  changedBy: string;
}

const priceChanges: PriceChange[] = [
  {
    id: "1",
    dateTime: "Dec 12, 2:30 PM",
    change: "Weekend Surcharge updated",
    details: "25% → 30%",
    changedBy: "John D.",
  },
  {
    id: "2",
    dateTime: "Dec 10, 11:00 AM",
    change: "CMA CGM: Food Grade Storage",
    details: "$28/day → $25/day",
    changedBy: "Admin",
  },
  {
    id: "3",
    dateTime: "Dec 8, 4:15 PM",
    change: "New rate card created",
    details: "Reefer Pre-cooling ($75)",
    changedBy: "Admin",
  },
  {
    id: "4",
    dateTime: "Dec 5, 9:00 AM",
    change: "MSC contract rates applied",
    details: "15% tier discount",
    changedBy: "Admin",
  },
  {
    id: "5",
    dateTime: "Dec 1, 10:30 AM",
    change: "Food Grade Cleaning updated",
    details: "$800 → $850",
    changedBy: "Admin",
  },
  {
    id: "6",
    dateTime: "Nov 28, 3:00 PM",
    change: "New surcharge created",
    details: "Reefer Pre-cooling",
    changedBy: "John D.",
  },
];

export default function PriceHistoryPage() {
  const [dateRange, setDateRange] = useState("30");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Price History</h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of all pricing changes
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rate-card">Rate Card</SelectItem>
            <SelectItem value="customer">Customer Rate</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="surcharge">Surcharge</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Changed By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="john">John D.</SelectItem>
            <SelectItem value="jane">Jane S.</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Changes Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Changed By</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceChanges.map((change) => (
              <TableRow key={change.id}>
                <TableCell className="font-medium">{change.dateTime}</TableCell>
                <TableCell>{change.change}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {change.details}
                  </Badge>
                </TableCell>
                <TableCell>{change.changedBy}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1-6 of 48 changes</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            ← Prev
          </Button>
          <Button variant="outline" size="sm">
            Next →
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
