"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

const data = [
  { date: "Mon", surveys: 12, repairs: 8, cleaning: 5 },
  { date: "Tue", surveys: 15, repairs: 10, cleaning: 7 },
  { date: "Wed", surveys: 10, repairs: 12, cleaning: 6 },
  { date: "Thu", surveys: 18, repairs: 9, cleaning: 8 },
  { date: "Fri", surveys: 14, repairs: 15, cleaning: 9 },
  { date: "Sat", surveys: 8, repairs: 6, cleaning: 4 },
  { date: "Sun", surveys: 5, repairs: 4, cleaning: 3 },
];

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export function OperationsTrendChart() {
  const [tokens, setTokens] = useState({
    grid: "#e5e7eb",
    axis: "#6b7280",
    surface: "#ffffff",
    border: "#e5e7eb",
    surveys: "#2563eb",
    repairs: "#dc2626",
    cleaning: "#059669",
  });

  useEffect(() => {
    setTokens({
      grid: readToken("--gecko-border", "#e5e7eb"),
      axis: readToken("--gecko-text-secondary", "#6b7280"),
      surface: readToken("--gecko-bg-surface", "#ffffff"),
      border: readToken("--gecko-border", "#e5e7eb"),
      surveys: readToken("--gecko-primary-600", "#2563eb"),
      repairs: readToken("--gecko-error-600", "#dc2626"),
      cleaning: readToken("--gecko-success-600", "#059669"),
    });
  }, []);

  return (
    <div className="gecko-card gecko-card-body">
      <h3 className="mb-4 gecko-card-title">
        Operations Trend (7 Days)
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} />
            <XAxis
              dataKey="date"
              stroke={tokens.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={tokens.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="surveys"
              name="Surveys"
              stroke={tokens.surveys}
              strokeWidth={2}
              dot={{ fill: tokens.surveys, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="repairs"
              name="Repairs"
              stroke={tokens.repairs}
              strokeWidth={2}
              dot={{ fill: tokens.repairs, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="cleaning"
              name="Cleaning"
              stroke={tokens.cleaning}
              strokeWidth={2}
              dot={{ fill: tokens.cleaning, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
