"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge } from "@/components/tariff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function CustomerRateDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  console.log("🟡 CustomerRateDetailPage - Component Loading");

  const { customerId } = use(params);

  console.log("🟡 Customer ID:", customerId);
  console.log("🟡 CustomerRateDetailPage - Loaded Successfully");

  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/customer-rates">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customer Rates
        </Button>
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            CMA CGM (Thailand) Co., Ltd.
          </h1>
        </div>
        <Link href={`/tariff/customer-rates/${customerId}/edit`}>
          <Button>Edit Rates</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tier:</span>
              <TierBadge tier="platinum" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Contract:</span>
              <Link
                href="/tariff/contracts/ctr-2024-001"
                className="ml-2 text-sm font-medium text-primary hover:underline"
              >
                CTR-2024-001
              </Link>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Valid:</span>
              <span className="ml-2 text-sm">Jan 1 - Dec 31, 2024</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Credit Limit:</span>
              <span className="ml-2 text-sm">$50,000</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Payment Terms:</span>
              <span className="ml-2 text-sm">Net 30</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Base Discount:</span>
              <span className="ml-2 text-sm font-semibold">20%</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Contract Rates:</span>
              <span className="ml-2 text-sm">8 custom</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Special Rates:</span>
              <span className="ml-2 text-sm">3 services</span>
            </div>
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground">Est. Monthly Savings:</span>
              <span className="ml-2 text-lg font-bold" style={{ color: "var(--gecko-success-600)" }}>$2,400</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Rates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Customer Rate</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Survey */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="font-semibold">
                  SURVEY
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tank Survey</TableCell>
                <TableCell>$100</TableCell>
                <TableCell>$80</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Container Survey</TableCell>
                <TableCell>$60</TableCell>
                <TableCell>$48</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PTI Test</TableCell>
                <TableCell>$150</TableCell>
                <TableCell>$120</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>

              {/* Cleaning */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="font-semibold">
                  CLEANING
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Standard Clean</TableCell>
                <TableCell>$200</TableCell>
                <TableCell>$160</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Chemical Wash</TableCell>
                <TableCell>$450</TableCell>
                <TableCell>$360</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>
              <TableRow style={{ background: "var(--gecko-primary-50)" }}>
                <TableCell className="font-medium">Food Grade Clean</TableCell>
                <TableCell>$850</TableCell>
                <TableCell className="font-semibold">$650</TableCell>
                <TableCell className="font-semibold" style={{ color: "var(--gecko-primary-600)" }}>-24%</TableCell>
                <TableCell>
                  <Badge variant="primary">Custom ⭐</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hazmat Clean</TableCell>
                <TableCell>$650</TableCell>
                <TableCell>$520</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>

              {/* Storage */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="font-semibold">
                  STORAGE
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>General Zone</TableCell>
                <TableCell>$25/day</TableCell>
                <TableCell>$20/day</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>
              <TableRow style={{ background: "var(--gecko-primary-50)" }}>
                <TableCell className="font-medium">Food Grade Zone</TableCell>
                <TableCell>$35/day</TableCell>
                <TableCell className="font-semibold">$25/day</TableCell>
                <TableCell className="font-semibold" style={{ color: "var(--gecko-primary-600)" }}>-29%</TableCell>
                <TableCell>
                  <Badge variant="primary">Custom ⭐</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hazmat Zone</TableCell>
                <TableCell>$50/day</TableCell>
                <TableCell>$40/day</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>

              {/* Labor */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="font-semibold">
                  LABOR
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Technician Labor</TableCell>
                <TableCell>$75/hr</TableCell>
                <TableCell>$60/hr</TableCell>
                <TableCell>-20%</TableCell>
                <TableCell>
                  <Badge variant="secondary">Tier</Badge>
                </TableCell>
              </TableRow>
              <TableRow style={{ background: "var(--gecko-primary-50)" }}>
                <TableCell className="font-medium">Specialist Labor</TableCell>
                <TableCell>$100/hr</TableCell>
                <TableCell className="font-semibold">$85/hr</TableCell>
                <TableCell className="font-semibold" style={{ color: "var(--gecko-primary-600)" }}>-15%</TableCell>
                <TableCell>
                  <Badge variant="primary">Custom ⭐</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-4">
            ⭐ = Custom negotiated rate (overrides tier discount)
          </p>
        </CardContent>
      </Card>

      {/* Volume Discounts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Volume Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monthly Volume</TableHead>
                <TableHead>Additional Discount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>50+ units</TableCell>
                <TableCell>+2%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>100+ units</TableCell>
                <TableCell>+5%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>200+ units</TableCell>
                <TableCell>+8%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rate History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rate History</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm">Food Grade Zone storage updated: $28 → $25/day</p>
                <p className="text-xs text-muted-foreground mt-1">Dec 10, 2024</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm">Contract renewed for 2024</p>
                <p className="text-xs text-muted-foreground mt-1">Jan 1, 2024</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm">Food Grade Clean rate negotiated: $650</p>
                <p className="text-xs text-muted-foreground mt-1">Nov 15, 2023</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
